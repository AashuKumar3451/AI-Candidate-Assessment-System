import { Router } from "express";
const router = Router();
import axios from "axios";

import UsersDetailsModel from "../models/UsersDetails.js";
import JobDescriptionsModel from "../models/JobDescriptions.js";
import CandidatesModel from "../models/Candidates.js";
import TestModel from "../models/Test.js";

const checkCandidate = async (userID) => {
  try {
    const user = await UserDetailsModel.findById(userID);
    return user.role === "candidate";
  } catch (error) {
    return false;
  }
};

router.get("/show/:JID", async (req, res) => {
  try {
    const JID = req.params.JID;
    const userID = req.userPayload.id;
    const candidate = await CandidatesModel.findOne({ userID: userID });
    if (!candidate) {
      return res.status(403).json("No Access Granted.");
    }
    const test = await TestModel.findOne({
      candidateID: candidate._id,
      jobDescriptionID: JID,
    });
    if (!test) {
      return res.status(403).json("No Test Available For you right now.");
    }
    return res
      .status(200)
      .json({ candidate: test.candidateID, test: test.questions });
  } catch (error) {
    res.status(401).json({ err: error });
  }
});

router.post("/submit/:JID", async (req, res) => {
  try {
    const userID = req.userPayload.id;
    const JID = req.params.JID;
    const answers = req.body;

    if (!Array.isArray(answers) || answers.some((a) => typeof a !== "string")) {
      return res.status(400).json({
        error: "Invalid answers format. Expected an array of strings.",
      });
    }

    const user = await UsersDetailsModel.findById(userID);
    if (!user) {
      return res.status(403).json("User not available.");
    }
    const candidate = await CandidatesModel.findOne({ userID: userID });
    if (!candidate) {
      return res.status(403).json("No Access Granted.");
    }
    const test = await TestModel.findOne({
      candidateID: candidate._id,
      jobDescriptionID: JID,
    });
    if (!test) {
      return res.status(403).json("No Test is available for you right now.");
    }

    // New condition: Prevent resubmission if answers already exist
    if (test.answers && test.answers.length > 0) {
      return res.status(400).json({
        error: "You have already submitted your answers. Submission not allowed again.",
      });
    }

    test.answers = answers;
    await test.save();

    const pythonAPI = "http://127.0.0.1:5000/test-scan";
    const response = await axios.post(
      pythonAPI,
      {
        questions: test.questions,
        answers,
        candidateName: user.name,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.data.success) {
      return res
        .status(400)
        .json({ error: "Error in evaluating the answers." });
    }
    candidate.testScore = response.data.finalScore;
    candidate.testReport = response.data.testReport;
    const response2 = await candidate.save();
    if (!response2) {
      return res
        .status(400)
        .json({ error: "Error in saving the test report." });
    }
    
    return res.status(200).json({
      message: "Answers submitted successfully.",
      finalScore: response.data.finalScore,
      evaluation: response.data.testReport,
    });
  } catch (error) {
    res.status(401).json({ err: error });
  }
});

router.post("/save-report/:CID", async (req, res) => {
  try {
  } catch (error) {}
});

export default router;
