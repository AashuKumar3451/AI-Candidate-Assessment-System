import mongoose from "mongoose";

const TestSchema = mongoose.Schema({
  candidateID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Candidates"
  },
  jobDescriptionID:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "JobDescriptions"
  },
  questions: [{
        type: String,
        required: true
  }],
  answers: [{
    type: String,
  }]
}, { timestamps: true });

const TestModel = mongoose.model("Test", TestSchema);
export default TestModel;