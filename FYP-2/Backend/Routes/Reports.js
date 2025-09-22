import { Router } from "express";

import { configDotenv } from "dotenv";
// import nodemailer from "nodemailer"; // Removed - using EmailJS instead

const router = Router();
configDotenv({ path: "../../.env" });


import UserDetailsModel from "../models/UsersDetails.js";
import TestReportModel from "../models/TestReport.js";
import CandidatesModel from "../models/Candidates.js";
import EmailsModel from "../models/Emails.js";
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
    // ✅ Email will be sent by frontend using EmailJS
    console.log("📨 Email will be sent by frontend using EmailJS");

    // Return success response
    res.status(200).json({
      message: "Candidate selected successfully.",
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
      return res.status(400).json("This candidate was not selected for interview, so cannot be rejected from interview.");
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
    // ✅ Email will be sent by frontend using EmailJS
    console.log("📨 Email will be sent by frontend using EmailJS");

    res.status(200).json({
      message: "Candidate rejected successfully.",
      candidate: candidate.id,
    });
  } catch (error) {
    res.status(401).json({ err: error });
  }
});


/*
router.get("/:CID/:JID", async (req, res) => {
  try {
    const { CID, JID } = req.params;
    const userID = req.userPayload.id;

    console.log("Incoming request to /reports/:CID/:JID");
    console.log("Candidate ID:", CID);
    console.log("Job ID:", JID);
    console.log("User ID from token:", userID);

    // Check HR permission
    const isHR = await checkHR(userID);
    console.log("Is HR?", isHR);

    if (!isHR) {
      console.warn("Unauthorized access attempt by user:", userID);
      return res.status(403).json("No Access Granted.");
    }

    // Attempt to find report
    console.log("Searching for test report with candidateID and jobDescriptionID...");
    const report = await TestReportModel.findOne({
      candidateID: CID,
      jobDescriptionID: JID
    });

    if (!report) {
      console.warn("No report found for Candidate:", CID, "and Job:", JID);
      return res.status(404).json({ error: "Report not found" });
    }

    console.log("Report found. Sending response...");
    res.status(200).json({
      reportText: report.reportText,
      reportPdfBase64: report.reportPdf.toString("base64")
    });

  } catch (error) {
    console.error("Error in GET /:CID/:JID:", error);
    res.status(500).json({ error: error.message });
  }
});
*/

router.get("/:CID/:JID", async (req, res) => {
  try {
    const { CID, JID } = req.params;

    console.log("Incoming request to /reports/:CID/:JID");
    console.log("Candidate ID:", CID);
    console.log("Job ID:", JID);

    // Find the candidate's user ID from CID
const candidate = await CandidatesModel.findOne({ _id: CID });
    if (!candidate) {
      console.warn("Candidate not found:", CID);
      return res.status(404).json({ error: "Candidate not found" });
    }

    const userID = candidate.userID;
    console.log("Candidate's User ID:", userID);

    // Check HR permission
 

    // Attempt to find the report
    console.log("Searching for test report with candidateID and jobDescriptionID...");
    const report = await TestReportModel.findOne({
      candidateID: userID,
      jobDescriptionID: JID
    });

    if (!report) {
      console.warn("No report found for Candidate:", userID, "and Job:", JID);
      return res.status(404).json({ error: "Report not found" });
    }

    console.log("Report found. Sending response...");

    // Responding with the report details
    res.status(200).json({
      reportText: report.reportText,
      reportPdfBase64: report.reportPdf.toString("base64"),
      generatedAt: report.generatedAt || "Not Available",
      testScore: report.score ?? null 
      
    });

  } catch (error) {
    console.error("Error in GET /:CID/:JID:", error);
    res.status(500).json({ error: error.message });
  }
});


export default router;
