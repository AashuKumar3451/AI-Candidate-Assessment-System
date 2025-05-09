import { Router } from "express";
const router = Router();
import axios from "axios";

import UsersDetailsModel from "../models/UsersDetails.js";
import TestReportModel from "../models/TestReport.js";
import CandidatesModel from "../models/Candidates.js";
import TestModel from "../models/Test.js";

const checkCandidate = async (userID) => {
  try {
    const user = await UsersDetailsModel.findById(userID);
    return user.role === "candidate";
  } catch (error) {
    return false;
  }
};

router.get("/show/:JID", async (req, res) => {
  try {
    const JID = req.params.JID;
    const userID = req.userPayload.id;
    if (!(await checkCandidate(userID))) {
      console.warn("⚠️ Access denied: Not a candidate");
      return res.status(403).json("No Access Granted.");
    }
    const candidate = await CandidatesModel.findOne({ userID });
    if (!candidate) return res.status(403).json("No Access.");

    const test = await TestModel.findOne({
      candidateID: candidate._id,
      jobDescriptionID: JID,
    });
    if (!test || new Date() > test.testAccessDeadline) {
      return res.status(403).json("Test expired or not available.");
    }
    res.status(200).json({ candidate: test.candidateID, test: test.questions });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

router.post("/submit/:JID", async (req, res) => {
  try {
    const userID = req.userPayload.id;
    const JID = req.params.JID;
    if (!(await checkCandidate(userID))) {
      console.warn("⚠️ Access denied: Not a candidate");
      return res.status(403).json("No Access Granted.");
    }
    const { mcqs, pseudocode, theory } = req.body;

    const user = await UsersDetailsModel.findById(userID);
    if (!user) return res.status(403).json("User not available.");

    const candidate = await CandidatesModel.findOne({ userID });
    if (!candidate) return res.status(403).json("Candidate not found.");

    const test = await TestModel.findOne({ candidateID: candidate._id, jobDescriptionID: JID });
    if (!test || new Date() > test.testAccessDeadline) {
      return res.status(403).json("Test expired or not available.");
    }

    // Ensure that the answers are not already submitted (by checking if answers are empty)
    if (
      test.answers &&
      (
        test.answers.mcqs.length > 0 ||
        test.answers.pseudocode.length > 0 ||
        test.answers.theory.length > 0
      )
    ) {
      return res.status(400).json({ error: "Already submitted." });
    }

    // If answers are not already submitted, save the answers
    test.answers = { mcqs, pseudocode, theory };
    await test.save();

    // Send data to the Python API for evaluation
    const pythonAPI = "http://127.0.0.1:5000/test-scan";
    const response = await axios.post(pythonAPI, {
      questions: test.questions,
      answers: test.answers,
      candidateName: user.name,
    });

    if (!response.data.success) return res.status(500).json({ error: "Evaluation failed." });

    const { finalScore, testReport, testReportPdf } = response.data;

    // Save the PDF report and evaluation in a separate report model
    const reportDoc = new TestReportModel({
      candidateID: candidate._id,
      jobDescriptionID: JID,
      reportText: testReport,
      reportPdf: Buffer.from(testReportPdf, "base64"),
      score: finalScore,
    });
    await reportDoc.save();

    candidate.testScore = finalScore;
    candidate.testReport = testReport; // optional if keeping in both places
    await candidate.save();

    res.status(200).json({
      message: "Answers submitted and evaluated successfully.",
      finalScore,
      evaluation: testReport,
      reportID: reportDoc._id,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

router.get("/my-report/:JID", async (req, res) => {
  try {
    const userID = req.userPayload.id; 
    const JID = req.params.JID;


    if (!(await checkCandidate(userID))) {
      console.warn("⚠️ Access denied: Not a candidate");
      return res.status(403).json("No Access Granted.");
    }

    const candidate = await CandidatesModel.findOne({ userID: userID });
    if (!candidate) {
      return res.status(403).json("Candidate not found.");
    }
    const report = await TestReportModel.findOne({
      candidateID: candidate._id,
      jobDescriptionID: JID,
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    res.status(200).json({
      reportText: report.reportText,
      reportPdfBase64: report.reportPdf.toString("base64"),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
