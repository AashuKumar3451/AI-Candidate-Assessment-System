import mongoose from "mongoose";

const HRSchema = mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersDetails",
    required: true,
  },
  createdJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobDescriptions"
  }],
  selectedCandidatesForTest: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersDetails",
  }],
  selectedCandidatesForInterview: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersDetails" 
  }]
});

const HRModel = mongoose.model("HR", HRSchema);
export default HRModel;