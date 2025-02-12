import mongoose from "mongoose";

const EmailsSchema = mongoose.Schema({
  candidateID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidates",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["test-schedule", "hr-decision", "general"],
    default: "general"
  },
  createdAt: { type: Date, default: Date.now },
});

const EmailsModel = mongoose.model("Emails", EmailsSchema);
export default EmailsModel;
