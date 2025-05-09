import mongoose from "mongoose";

const testReportSchema = new mongoose.Schema({
  candidateID: { type: mongoose.Schema.Types.ObjectId, ref: "Candidates", required: true },
  jobDescriptionID: { type: mongoose.Schema.Types.ObjectId, ref: "JobDescriptions", required: true },
  reportText: { type: String, required: true },
  reportPdf: { type: Buffer, required: true },
  score: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },

});

const TestReportModel = mongoose.model("TestReport", testReportSchema);
export default TestReportModel;