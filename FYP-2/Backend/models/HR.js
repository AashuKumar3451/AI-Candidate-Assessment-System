import mongoose from "mongoose";

const HRSchema = mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  createdJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobDescriptions"
  }],
  selectedCandidatesForTest: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  }],
  selectedCandidatesForInterview: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users" 
  }]
});

const HRModel = mongoose.model("HR", HRSchema);
export default HRModel;