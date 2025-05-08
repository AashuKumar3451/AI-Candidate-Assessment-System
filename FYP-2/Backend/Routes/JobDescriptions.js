import { Router } from "express";
import multer from "multer";
import axios from "axios";
import { configDotenv } from "dotenv";
import nodemailer from "nodemailer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
configDotenv({ path: "../../.env" });

import UserDetailsModel from "../models/UsersDetails.js";
import JobDescriptionsModel from "../models/JobDescriptions.js";
import CandidatesModel from "../models/Candidates.js";
import EmailsModel from "../models/Emails.js";
import TestModel from "../models/Test.js";
import HRModel from "../models/HR.js";

// Function to send email and store in DB
const sendAndStoreEmail = async ({ candidateID, to, message, type }) => {
  try {
    // Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your App Password (NOT your real password)
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Notification: ${type}`,
      text: message,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Store email data in MongoDB
    const emailRecord = new EmailsModel({ candidateID, message, type });
    await emailRecord.save();

    return { success: true, message: "Email sent & stored successfully." };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

const checkHR = async (userID) => {
  try {
    const user = await UserDetailsModel.findById(userID);
    return user.role === "hr";
  } catch (error) {
    return false;
  }
};

const checkCandidate = async (userID) => {
  try {
    const user = await UserDetailsModel.findById(userID);
    return user.role === "candidate";
  } catch (error) {
    return false;
  }
};

// ✅ Apply for a job (POST /apply/:JID)
router.post("/apply/:JID", upload.single("resume"), async (req, res) => {
  try {
    // 🐛 Debug: Log request details
    console.log("📝 CV Upload Request Received");
    console.log("Route Param - Job ID (JID):", req.params.JID);
    console.log("User ID (from token or temp):", req.userPayload?.id || "test-candidate-id");
    console.log("Form Data:", req.body);
    console.log("Uploaded File Info:", req.file);

    // TEMP ONLY
    const userID = req.userPayload?.id || "test-candidate-id";
    const jobID = req.params.JID;

    if (!(await checkCandidate(userID))) {
      console.warn("⚠️ Access denied: Not a candidate");
      return res.status(403).json("No Access Granted.");
    }

    // Check if the candidate already applied for the same job
    const existingCandidate = await CandidatesModel.findOne({
      userID,
      jobDescriptionAppliedFor: jobID,
    });

    if (existingCandidate) {
      console.warn("⚠️ Duplicate application detected");
      return res.status(400).json("You have already applied for this job.");
    }

    // Create a new candidate entry
    const newCandidate = new CandidatesModel({
      userID,
      coverLetter: req.body.coverLetter || "", // fallback to avoid undefined
      jobDescriptionAppliedFor: jobID,
      resume: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    });

    const response = await newCandidate.save();
    if (!response) {
      console.error("❌ Failed to save new candidate");
      return res.status(500).json("Error saving the application.");
    }

    const JD = await JobDescriptionsModel.findById(jobID);
    if (!JD) {
      console.warn("⚠️ Job not found");
      return res.status(404).json("Job is not available anymore.");
    }

    JD.candidatesApplied.push(newCandidate.id);
    const response2 = await JD.save();
    if (!response2) {
      console.error("❌ Failed to update job with new candidate");
      return res.status(500).json("Error saving the application.");
    }

    // Process resume with Flask service
    const buffer = req.file.buffer;
    const jobDescription = JD.details;

    // Ensure large payloads are handled properly
    const flaskResponse = await axios.post(
      "http://localhost:5000/resume-scan",
      {
        pdf: buffer.toString("base64"),
        jobDescription: jobDescription,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        maxBodyLength: Infinity, // Allow large request body size
        maxContentLength: Infinity, // Allow large content size
      }
    );

    // Check if Flask response is valid
    if (!flaskResponse.data || !flaskResponse.data.extractedText) {
      console.error("❌ Failed to process resume with Flask");
      return res.status(500).json("Error processing resume with Flask.");
    }

    const extractedText = flaskResponse.data.extractedText;
    const extractedJDText = flaskResponse.data.jobDescription;
    const resumeScore = flaskResponse.data.similarityScore;

    // Update candidate with analysis results
    newCandidate.resumeText = extractedText;
    newCandidate.resumeScore = resumeScore;
    await newCandidate.save();

    // Update JD again to ensure candidate is linked
    const jd = await JobDescriptionsModel.findOne({ _id: jobID });
    jd.candidatesApplied.push(newCandidate.id);
    await jd.save();

    // ✅ Success
    console.log("✅ CV upload and processing complete for user:", userID);
    res.status(200).json({
      message: "Text extraction successful",
      candidate: newCandidate.id,
      resumeText: newCandidate.resumeText,
      jdText: extractedJDText,
      resumeScore: newCandidate.resumeScore,
    });

  } catch (error) {
    console.error("❌ Error in /apply/:JID route:", error);
    res.status(500).json({ err: error.message || "Internal server error" });
  }
});

// ✅ Add a job description (POST /add-jd/form)
router.post("/add-jd/form", async (req, res) => {
  try {
    const userID = req.userPayload.id;
    if (!(await checkHR(userID))) {
      return res.status(403).json("No Access Granted.");
    }
    const hrID = await HRModel.findOne({ userID });
    const jdData = { ...req.body, hrID: hrID._id };
    const jd = new JobDescriptionsModel(jdData);
    const response = await jd.save();
    if (!response) {
      return res.status(201).json("Error saving the job description.");
    }

    // Save JD to HR table
    const hr = await HRModel.findByIdAndUpdate(
      hrID,
      { $push: { createdJobs: response._id } }, // Add the JD ID to createdJobs array
      { new: true } // Return the updated HR document
    );

    if (!hr) {
      return res.status(500).json("Error updating HR table with job description.");
    }


    res.status(200).json({ jd: response, hr });
  } catch (error) {
    console.log("Error Occured", error);
    res.status(401).json({ err: error });
  }
});

// ✅ Fetch all applications for a job description (GET /applications/:JID)
router.get("/applications/:JID", async (req, res) => {
  try {
    const hrID = req.userPayload.id;
    if (!(await checkHR(hrID))) {
      return res.status(403).json("No Access Granted.");
    }

    const jobID = req.params.JID;
    const JD = await JobDescriptionsModel.findById(jobID);
    const candidatesID = JD?.candidatesApplied || [];

    if (candidatesID.length === 0) {
      return res.status(200).json({ candidates: [] });
    }

    let candidates = await Promise.all(
      candidatesID.map(async (id) => {
        const candidate = await CandidatesModel.findById(id);
        if (!candidate) return null;

        const user = await UserDetailsModel.findById(candidate.userID);

        return {
          _id: candidate._id,
          coverLetter: candidate.coverLetter,
          jobDescriptionAppliedFor: candidate.jobDescriptionAppliedFor,
          resume: candidate.resume
            ? `data:${candidate.resume.contentType};base64,${candidate.resume.data.toString("base64")}`
            : null,
          isSelectedForInterview: candidate.isSelectedForInterview,
          isSelectedForTest: candidate.isSelectedForTest,
          resumeScore: candidate.resumeScore,
          resumeText: candidate.resumeText?.slice(0, 300),
          user: user ? {
            name: user.name,
            email: user.email,
            phone: user.phone
          } : null
        };
      })
    );

    candidates = candidates.filter((c) => c !== null);
    res.status(200).json({ candidates });

  } catch (error) {
    console.error("Error in /applications/:JID:", error);
    res.status(500).json({ err: error.message || "Server error" });
  }
});

// ✅ Fetch all candidates (GET /candidates)
router.post("/select-resume/:JID/:CID", async (req, res) => {
  try {
    const hrID = req.userPayload.id;
    const CID = req.params.CID;
    if (!(await checkHR(hrID))) {
      return res.status(403).json("No Access Granted.");
    }
    // Find the candidate who applied for this job
    const candidate = await CandidatesModel.findOne({
      _id: CID,
      jobDescriptionAppliedFor: req.params.JID,
    });
    if(!candidate) {
      return res.status(400).json("Candidate not found.");
    }
    if (candidate && candidate.isSelectedForTest) {
      return res.status(400).json("This candidate is already selected for this test.");
    }
    candidate.isSelectedForTest = true;
    const response = await candidate.save();
    if (!response) {
      return res.status(201).json("Error occured.");
    }
    
    const user = await UserDetailsModel.findById(candidate.userID);
    if (!user) {
      return res.status(201).json("No user available.");
    }
    // Prepare email content
    const emailMessage = `Dear ${user.name},\n\nCongratulations! You have been selected for the test.\nYour test details will be sent soon.\n\nBest regards,\nHR Team`;

    // Send email and store in database
    const emailResponse = await sendAndStoreEmail({
      candidateID: candidate.id,
      to: user.email, // Assuming 'email' field exists in CandidatesModel
      message: emailMessage,
      type: "test-schedule",
    });

    if (!emailResponse.success) {
      return res.status(500).json({ error: "Email sending failed." });
    }

    //when someone is selected for test his/her id should come in hr table
    const hr = await HRModel.findOne({ userID: hrID });
    hr.selectedCandidatesForTest.push(candidate.id);
    await hr.save();


    const jd = await JobDescriptionsModel.findById(req.params.JID);
    if (!jd) {
      return res.status(201).json("No candidate available.");
    }

    // Call Python API for test generation
    const pythonAPI = "http://127.0.0.1:5000/test-generate"; // Change to your actual Python server URL
    const testResponse = await axios.post(
      pythonAPI,
      {
        resume: candidate.resumeText ? String(candidate.resumeText) : "",
        jobDescription: jd.details ? String(jd.details) : "",
      },
      {
        headers: {
          "Content-Type": "application/json", // Ensures Flask receives the data as a PDF
        },
      }
    );
    if (!testResponse.data.success) {
      return res.status(500).json({ error: "Test generation failed." });
    }

    // Save test to database
    const newTest = new TestModel({
      candidateID: candidate._id,
      jobDescriptionID: req.params.JID,
      questions: testResponse.data.questions, // Store generated test from Python
    });

    await newTest.save();

    // Return success response
    res.status(200).json({
      message: "Candidate selected and email sent successfully.",
      candidate: candidate.id,
      test: newTest,
    });
  } catch (error) {
    res.status(401).json({ err: error });
  }
});


// ✅ Reject a candidate (POST /reject-resume/:JID/:CID)
router.post("/reject-resume/:JID/:CID", async (req, res) => {
  try {
    const hrID = req.userPayload.id;
    const CID = req.params.CID;
    if (!(await checkHR(hrID))) {
      return res.status(403).json("No Access Granted.");
    }
    // Find the candidate who applied for this job
    const candidate = await CandidatesModel.findOne({
      _id: CID,
      jobDescriptionAppliedFor: req.params.JID,
    });
    if(!candidate) {
      return res.status(400).json("Candidate not found.");
    }
    if (candidate && !candidate.isSelectedForTest) {
      return res.status(400).json("This candidate is already rejected for this test.");
    }
    candidate.isSelectedForTest = false;
    const response = await candidate.save();
    if (!response) {
      return res.status(201).json("Error occured.");
    }

    const user = await UserDetailsModel.findById(candidate.userID);
    if (!user) {
      return res.status(201).json("No user available.");
    }
    const emailMessage = `Dear ${user.name},\n\nSo Sorry! You are not selected for the test. \nYour test details will be sent soon.\n\nBest regards,\nHR Team`;
    const emailResponse = await sendAndStoreEmail({
      candidateID: candidate.id,
      to: user.email,
      message: emailMessage,
      type: "test-schedule",
    });
    if (!emailResponse.success) {
      return res.status(500).json({ error: "Email sending failed." });
    }

    res.status(200).json({
      message: "Candidate rejected and email sent successfully.",
      candidate: candidate.id,
    });
  } catch (error) {
    res.status(401).json({ err: error });
  }
});

// ✅ Fetch selected candidates for interview (GET /selected-candidates/:JID)
router.get("/selected-candidates/:JID", async (req, res) => {
  try {
    const hrID = req.userPayload.id;
    if (!(await checkHR(hrID))) {
      return res.status(403).json("No Access Granted.");
    }
    const jobID = req.params.JID;
    const JD = await JobDescriptionsModel.findById(jobID);
    const candidatesID = JD.candidatesApplied;
    if (!candidatesID) {
      return res.status(201).json("No Active Applications.");
    }
    let candidates = await Promise.all(
      candidatesID.map(async (id) => {
        const candidate = await CandidatesModel.findById(id);
        if (!candidate) return null; // Handle case where candidate does not exist

        return {
          _id: candidate._id,
          coverLetter: candidate.coverLetter,
          jobDescriptionAppliedFor: candidate.jobDescriptionAppliedFor,
          resume: candidate.resume
            ? `data:${
                candidate.resume.contentType
              };base64,${candidate.resume.data.toString("base64")}`
            : null,
          isSelectedForInterview: candidate.isSelectedForInterview,
          isSelectedForTest: candidate.isSelectedForTest,
        };
      })
    );
    candidates = candidates.filter((c) => c !== null);
    candidates = candidates.filter((c) => c.isSelectedForInterview === true);
    res.status(200).json({ candidates: candidates });
  } catch (error) {
    res.status(401).json({ err: error });
  }
});

// ✅ Fetch all job descriptions (GET /getJD)
router.get('/getJD', async (req, res) => {
  try {
    const userID = req.userPayload.id;

    const jds = await JobDescriptionsModel.find(); // You can use .populate('hrID') if needed
    res.status(200).json(jds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job descriptions', details: error.message });
  }
});


export default router;
