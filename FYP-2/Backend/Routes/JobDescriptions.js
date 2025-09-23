import { Router } from "express";
import multer from "multer";
import axios from "axios";
import { configDotenv } from "dotenv";
// import nodemailer from "nodemailer"; // Removed - using EmailJS instead

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
configDotenv({ path: "../../.env" });

import UserDetailsModel from "../models/UsersDetails.js";
import JobDescriptionsModel from "../models/JobDescriptions.js";
import CandidatesModel from "../models/Candidates.js";
import EmailsModel from "../models/Emails.js";
import TestModel from "../models/Test.js";
import HRModel from "../models/HR.js";

// Function removed - using EmailJS from frontend instead

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

// ✅ Check if candidate has already applied for a job (GET /check-application/:JID)
router.get("/check-application/:JID", async (req, res) => {
  try {
    const userID = req.userPayload?.id;
    const jobID = req.params.JID;

    if (!userID) {
      return res.status(401).json("User not authenticated.");
    }

    if (!(await checkCandidate(userID))) {
      return res.status(403).json("No Access Granted.");
    }

    // Check if the candidate already applied for this job
    const existingCandidate = await CandidatesModel.findOne({
      userID,
      jobDescriptionAppliedFor: jobID,
    });

    const hasApplied = !!existingCandidate;
    
    res.status(200).json({
      hasApplied,
      applicationData: hasApplied ? {
        appliedAt: existingCandidate.createdAt,
        isSelectedForTest: existingCandidate.isSelectedForTest,
        isSelectedForInterview: existingCandidate.isSelectedForInterview,
        resumeScore: existingCandidate.resumeScore
      } : null
    });

  } catch (error) {
    console.error("Error checking application status:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Apply for a job (POST /apply/:JID)
router.post("/apply/:JID", upload.single("resume"), async (req, res) => {
  try {
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
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000";
    const flaskResponse = await axios.post(
      `${AI_SERVICE_URL}/resume-scan`,
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





router.get("/applications/tested/:JID", async (req, res) => {
  try {
    const hrID = req.userPayload.id;
    if (!(await checkHR(hrID))) {
      return res.status(403).json("No Access Granted.");
    }

    const jobID = req.params.JID;
    const testedCandidates = await CandidatesModel.find({
      jobDescriptionAppliedFor: jobID,
      isSelectedForTest: true,
      resumeScore: { $ne: null }
    }).populate("userID");

    const formatted = testedCandidates.map((candidate) => ({
      _id: candidate._id,
      testScore: candidate.resumeScore,
      user: {
        name: candidate.userID.name,
        email: candidate.userID.email,
        phone: candidate.userID.phone,
      },
    }));

    res.status(200).json({ candidates: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

























/*
// ✅ Select a candidate for test (POST /select-resume/:JID/:CID)
router.post("/select-resume/:JID/:CID", async (req, res) => {
  try {
    const hrID = req.userPayload.id;
    const CID = req.params.CID;
    if (!(await checkHR(hrID))) return res.status(403).json("No Access Granted.");

    const candidate = await CandidatesModel.findOne({
      _id: CID,
      jobDescriptionAppliedFor: req.params.JID,
    });
    if (!candidate) return res.status(400).json("Candidate not found.");
    if (candidate.isSelectedForTest) return res.status(400).json("Already selected.");

    candidate.isSelectedForTest = true;
    await candidate.save();

    const user = await UserDetailsModel.findById(candidate.userID);
    if (!user) return res.status(400).json("User not found.");

    const jd = await JobDescriptionsModel.findById(req.params.JID);
    if (!jd) return res.status(400).json("Job Description not found.");

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:5000";
    const pythonAPI = `${AI_SERVICE_URL}/test-generate`;
    const testResponse = await axios.post(pythonAPI, {
      resume: candidate.resumeText || "",
      jobDescription: jd.details || "",
    }, { headers: { "Content-Type": "application/json" } });

    if (!testResponse.data.success) return res.status(500).json({ error: "Test generation failed." });

    const newTest = new TestModel({
      candidateID: candidate._id,
      jobDescriptionID: req.params.JID,
      questions: testResponse.data.questions,
      testAccessDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
    await newTest.save();

    const hr = await HRModel.findOne({ userID: hrID });
    hr.selectedCandidatesForTest.push(candidate.id);
    await hr.save();

    const testLink = `http://localhost:8081/test/${candidate.id}/${req.params.JID}`;
    //const testLink = `http://localhost:8081/test/${req.params.JID}`;
    const emailMessage = `Dear ${user.name},\n\nCongratulations! You have been selected for the test.\nPlease take your test within 3 days using the following link:\n${testLink}\n\nBest regards,\nHR Team`;

    const emailResponse = await sendAndStoreEmail({
      candidateID: candidate.id,
      to: user.email,
      message: emailMessage,
      type: "test-schedule",
    });
    if (!emailResponse.success) return res.status(500).json({ error: "Email sending failed." });

    res.status(200).json({
      message: "Candidate selected and test created.",
      candidate: candidate.id,
      test: newTest,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});
*/


router.post("/select-resume/:JID/:CID", async (req, res) => {
try {
const hrID = req.userPayload.id;
const CID = req.params.CID;
const JID = req.params.JID;
console.log(`📌 HR ${hrID} is selecting candidate ${CID} for job ${JID}`);

// ✅ Check if HR
const isHR = await checkHR(hrID);
if (!isHR) {
  console.warn("❌ Not authorized: User is not an HR.");
  return res.status(403).json("No Access Granted.");
}

// ✅ Fetch Candidate
const candidate = await CandidatesModel.findOne({
  _id: CID,
  jobDescriptionAppliedFor: JID,
});
if (!candidate) {
  console.warn("❌ Candidate not found.");
  return res.status(400).json("Candidate not found.");
}
if (candidate.isSelectedForTest) {
  console.warn("⚠️ Candidate already selected for test.");
  return res.status(400).json("Already selected.");
}

candidate.isSelectedForTest = true;
await candidate.save();
console.log("✅ Candidate marked as selected:", candidate._id);

// ✅ Get user info
const user = await UserDetailsModel.findById(candidate.userID);
if (!user) {
  console.warn("❌ User details not found.");
  return res.status(400).json("User not found.");
}

// ✅ Get JD details
const jd = await JobDescriptionsModel.findById(JID);
if (!jd) {
  console.warn("❌ Job Description not found.");
  return res.status(400).json("Job Description not found.");
}

console.log("📨 Sending resume and JD to Python for test generation...");
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:5000";
const pythonAPI = `${AI_SERVICE_URL}/test-generate`;
const testResponse = await axios.post(
  pythonAPI,
  {
    resume: candidate.resumeText || "",
    jobDescription: jd.details || "",
  },
  {
    headers: { "Content-Type": "application/json" },
  }
);

if (!testResponse.data.success) {
  console.error("❌ Test generation failed from Python API.");
  return res.status(500).json({ error: "Test generation failed." });
}

console.log("✅ Test generated:", testResponse.data.questions);

// ✅ Create Test
const testAccessDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
const newTest = new TestModel({
  candidateID: candidate.userID,
  jobDescriptionID: JID,
  questions: testResponse.data.questions,
  testAccessDeadline,
});

console.log("📝 Test to be saved:", {
  candidateID: candidate.userID,
  jobDescriptionID: JID,
  deadline: testAccessDeadline,
});

await newTest.save();
console.log("✅ Test saved to database:", newTest._id);

// ✅ Update HR record
const hr = await HRModel.findOne({ userID: hrID });
if (!hr) {
  console.warn("⚠️ HR record not found.");
} else {
  hr.selectedCandidatesForTest.push(candidate._id);
  await hr.save();
  console.log("🧾 HR record updated with selected candidate.");
}

// ✅ Email will be sent by frontend using EmailJS
console.log("📨 Email will be sent by frontend using EmailJS");

res.status(200).json({
  message: "Candidate selected and test created.",
  candidate: candidate._id,
  test: newTest,
});
} catch (error) {
console.error("🔥 Error in /select-resume:", error.message);
return res.status(500).json({ err: error.message });
}
});










// ✅ Reject a candidate (POST /reject-resume/:JID/:CID)
router.post("/reject-resume/:JID/:CID", async (req, res) => {
  try {
    const hrID = req.userPayload.id;
    const CID = req.params.CID;
    const JID = req.params.JID;
    
    if (!(await checkHR(hrID))) {
      return res.status(403).json("No Access Granted.");
    }
    
    // Find the candidate who applied for this job
    const candidate = await CandidatesModel.findOne({
      _id: CID,
      jobDescriptionAppliedFor: JID,
    });
    
    if (!candidate) {
      return res.status(404).json("Candidate not found.");
    }
    
    // ✅ FIXED: Allow rejection of any candidate (whether selected or not)
    // Track if they were previously selected for email context
    const wasPreviouslySelected = candidate.isSelectedForTest === true;
    
    // Mark as rejected
    candidate.isSelectedForTest = false;
    await candidate.save();
    
    // ✅ FIXED: Remove from HR's selected candidates list
    const hr = await HRModel.findOne({ userID: hrID });
    if (hr) {
      hr.selectedCandidatesForTest = hr.selectedCandidatesForTest.filter(
        id => id.toString() !== candidate._id.toString()
      );
      await hr.save();
    }

    const user = await UserDetailsModel.findById(candidate.userID);
    if (!user) {
      return res.status(404).json("User not found.");
    }
    
    // ✅ Email will be sent by frontend using EmailJS
    console.log("📨 Email will be sent by frontend using EmailJS");

    res.status(200).json({
      message: "Candidate rejected successfully.",
      candidate: candidate.id,
      wasPreviouslySelected: wasPreviouslySelected,
    });
  } catch (error) {
    console.error("Error in reject-resume:", error);
    res.status(500).json({ error: error.message });
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
/*
router.get('/getJD', async (req, res) => {
  try {
    const userID = req.userPayload.id;

    const jds = await JobDescriptionsModel.find(); // You can use .populate('hrID') if needed
    res.status(200).json(jds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job descriptions', details: error.message });
  }
});
*/


// ✅ Get all available jobs for candidates (GET /getAllJobs)
router.get('/getAllJobs', async (req, res) => {
  try {
    const userID = req.userPayload.id;
    
    // Check if user is a candidate
    const user = await UserDetailsModel.findById(userID);
    if (!user || user.role !== 'candidate') {
      return res.status(403).json({ error: "Access denied. Only candidates can view all jobs." });
    }

    // Get all job descriptions
    const jds = await JobDescriptionsModel.find({}).populate('hrID', 'userID').populate({
      path: 'hrID',
      populate: {
        path: 'userID',
        select: 'name email'
      }
    });

    res.status(200).json(jds);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch job descriptions",
      details: error.message,
    });
  }
});

// ✅ Get job descriptions for HR users (GET /getJD)
router.get('/getJD', async (req, res) => {
  try {
    const userID = req.userPayload.id;

    // First, find the HR record linked to this user
    const hr = await HRModel.findOne({ userID });

    if (!hr) {
      return res.status(404).json({ error: "HR profile not found." });
    }

    // Now get only job descriptions created by this HR
    const jds = await JobDescriptionsModel.find({ hrID: hr._id });

    res.status(200).json(jds);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch job descriptions",
      details: error.message,
    });
  }
});





export default router;
