import { Router } from "express";

import { configDotenv } from "dotenv";
import nodemailer from "nodemailer";

const router = Router();
configDotenv({ path: "../../.env" });


import UserDetailsModel from "../models/UsersDetails.js";
import TestReportModel from "../models/TestReport.js";
import CandidatesModel from "../models/Candidates.js";
import EmailsModel from "../models/Emails.js";
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
    return user?.role === "candidate";
  } catch (error) {
    return false;
  }
};

router.post("/select/:JID/:CID", async (req, res) => {
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
    if (candidate && candidate.isSelectedForInterview) {
      return res.status(400).json("This candidate is already selected for this interview.");
    }
    candidate.isSelectedForInterview = true;
    const response = await candidate.save();
    if (!response) {
      return res.status(201).json("Error occured.");
    }

    //when someone is selected for interview his/her id should come in hr table
    const hr = await HRModel.findOne({userID: hrID});
    if(!hr){
      return res.status(201).json("No HR available.");
    }
    hr.selectedCandidatesForInterview.push(candidate.id);
    await hr.save();

    const user = await UserDetailsModel.findById(candidate.userID);
    if (!user) {
      return res.status(201).json("No user available.");
    }
    // Prepare email content
    const emailMessage = `Dear ${user.name},\n\nCongratulations! You have been selected for the physical Interview.\nYour Interview details will be sent soon.\n\nBest regards,\nHR Team`;

    // Send email and store in database
    const emailResponse = await sendAndStoreEmail({
      candidateID: candidate.id,
      to: user.email, // Assuming 'email' field exists in CandidatesModel
      message: emailMessage,
      type: "hr-decision",
    });

    if (!emailResponse.success) {
      return res.status(500).json({ error: "Email sending failed." });
    }

    // Return success response
    res.status(200).json({
      message: "Candidate selected and email sent successfully.",
      candidate: candidate.id,
    });
  } catch (error) {
    res.status(401).json({ err: error });
  }
});

router.post("/reject/:JID/:CID", async (req, res) => {
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
    if (candidate && !candidate.isSelectedForInterview) {
      return res.status(400).json("This candidate is already rejected for this interview.");
    }
    candidate.isSelectedForInterview = false;
    const response = await candidate.save();
    if (!response) {
      return res.status(201).json("Error occured.");
    }
    
    const user = await UserDetailsModel.findById(candidate.userID);
    if (!user) {
      return res.status(201).json("No user available.");
    }
    const emailMessage = `Dear ${user.name},\n\nSo Sorry! You are not selected for the Interview. \nYour test details will be sent soon.\n\nBest regards,\nHR Team`;
    const emailResponse = await sendAndStoreEmail({
      candidateID: candidate.id,
      to: user.email,
      message: emailMessage,
      type: "hr-decision",
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

router.get("/:CID/:JID", async (req, res) => {
  try {
    const { CID, JID } = req.params;
    const userID = req.userPayload.id;
    if (!(await checkHR(userID))) {
      return res.status(403).json("No Access Granted.");
    }
    const report = await TestReportModel.findOne({
      candidateID: CID,
      jobDescriptionID: JID
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({
      reportText: report.reportText,
      reportPdfBase64: report.reportPdf.toString("base64")
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




export default router;
