import mongoose from "mongoose";

const TestSchema = mongoose.Schema({
  candidateID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Candidates",
  },
  jobDescriptionID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "JobDescriptions",
  },
  questions: {
    mcqs: [
      {
        question: String,
        options: [String],
        answer: String,
      },
    ],
    pseudocode: [String],
    theory: [String],
  },
  answers: {
    mcqs:{
      type: [String],
      default: []
    },
    pseudocode:{
      type: [String],
      default: []
    },
    theory:{
      type: [String],
      default: []
    },
  },
  testAccessDeadline: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

const TestModel = mongoose.model("Test", TestSchema);
export default TestModel;