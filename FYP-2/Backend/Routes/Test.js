import { Router } from "express";
const router = Router();
import axios from "axios";

import UsersDetailsModel from "../models/UsersDetails.js";
import TestReportModel from "../models/TestReport.js";
import CandidatesModel from "../models/Candidates.js";
import TestModel from "../models/Test.js";


// 🔍 Utility to check if user is a candidate
const checkCandidate = async (userID) => {
  try {
    const user = await UsersDetailsModel.findById(userID);
    return user?.role === "candidate";
  } catch (error) {
    console.error("🔴 Error in checkCandidate:", error.message);
    return false;
  }
};

// ✅ Fetch test questions (for external candidates via email link)
router.get("/show/:candidateID/:JID", async (req, res) => {
  const JID = req.params.JID;
  const candidateID = req.params.candidateID;

  console.log(`➡️  GET /test/show/${candidateID}/${JID} for external candidate`);

  try {
    const candidate = await CandidatesModel.findOne({ userID: candidateID });
    if (!candidate) {
      console.warn("⛔ Candidate record not found");
      return res.status(403).json({ error: "No candidate record found." });
    }

    const test = await TestModel.findOne({
      candidateID: candidateID,
      jobDescriptionID: JID,
    });

    if (!test) {
      console.warn("⛔ No test found for candidate");
      return res.status(404).json({ error: "Test not available." });
    }

    if (new Date() > test.testAccessDeadline) {
      console.warn("⛔ Test access expired");
      return res.status(403).json({ error: "Test access deadline has passed." });
    }

    console.log("✅ Test fetched successfully");
    res.status(200).json({ candidate: test.candidateID, test: test.questions });

  } catch (error) {
    console.error("🔴 Error in /show/:candidateID/:JID:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Submit and evaluate answers (for external candidates via email link)
router.post("/submit/:candidateID/:JID", async (req, res) => {
  const candidateID = req.params.candidateID;
  const JID = req.params.JID;
  console.log(`➡️  POST /test/submit/${candidateID}/${JID} for external candidate`);

  try {
    const { mcqs, pseudocode, theory } = req.body;
    console.log("📦 Received answers:", { mcqs, pseudocode, theory });

    const candidate = await CandidatesModel.findOne({ userID: candidateID });
    if (!candidate) {
      console.error("⛔ Candidate record not found");
      return res.status(403).json({ error: "Candidate not found." });
    }

    const test = await TestModel.findOne({
      candidateID: candidateID,
      jobDescriptionID: JID,
    });

    if (!test) {
      console.error("⛔ Test not found");
      return res.status(404).json({ error: "Test not available." });
    }

    if (new Date() > test.testAccessDeadline) {
      console.warn("⛔ Test deadline expired");
      return res.status(403).json({ error: "Test expired." });
    }

    if (
      test.answers &&
      (test.answers.mcqs.length > 0 ||
        test.answers.pseudocode.length > 0 ||
        test.answers.theory.length > 0)
    ) {
      console.warn("⚠️ Test already submitted");
      return res.status(400).json({ error: "You have already submitted your answers." });
    }

    // Save answers
    test.answers = { mcqs, pseudocode, theory };
    await test.save();
    console.log("✅ Answers saved to DB");

    // Send for evaluation
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:5000";
    const pythonAPI = `${AI_SERVICE_URL}/test-scan`;
    console.log("📤 Sending to Python API:", pythonAPI);

    const response = await axios.post(pythonAPI, {
      questions: test.questions,
      answers: test.answers,
      candidateName: candidate.candidateName || "Candidate",
    });

    if (!response.data.success) {
      console.error("🔴 Evaluation failed from Python");
      return res.status(500).json({ error: "Evaluation failed." });
    }

    const { finalScore, testReport, testReportPdf } = response.data;

    // Save the report
    const reportDoc = new TestReportModel({
      candidateID: candidateID,
      jobDescriptionID: JID,
      reportText: testReport,
      reportPdf: Buffer.from(testReportPdf, "base64"),
      score: finalScore,
    });
    await reportDoc.save();

    // Save candidate score
    candidate.testScore = finalScore;
    candidate.testReport = testReport;
    await candidate.save();

    console.log("✅ Test evaluated and report stored");
    res.status(200).json({
      message: "Test submitted and evaluated successfully.",
      finalScore,
      evaluation: testReport,
      reportID: reportDoc._id,
    });

  } catch (error) {
    console.error("🔴 Error in /submit/:candidateID/:JID:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fetch submitted report


// ✅ Fetch submitted report (for external candidates via email link)
router.get("/my-report/:candidateID/:JID", async (req, res) => {
  const candidateID = req.params.candidateID;
  const JID = req.params.JID;

  console.log(`➡️  GET /test/my-report/${candidateID}/${JID} for external candidate`);

  try {
    const candidate = await CandidatesModel.findOne({ userID: candidateID });
    if (!candidate) {
      return res.status(403).json({ error: "Candidate not found." });
    }

    const report = await TestReportModel.findOne({
      candidateID: candidateID,
      jobDescriptionID: JID,
    });

    if (!report) {
      console.warn("⚠️ No report found");
      return res.status(404).json({ error: "Report not found." });
    }

    console.log("✅ Report fetched successfully");
    res.status(200).json({
      reportText: report.reportText,
      reportPdfBase64: report.reportPdf.toString("base64"),
    });

  } catch (error) {
    console.error("🔴 Error in /my-report/:candidateID/:JID:", error);
    res.status(500).json({ error: error.message });
  }
});

// Note: HR report route moved to Reports.js with proper authentication








export default router;
