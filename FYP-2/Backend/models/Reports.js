import mongoose from "mongoose";

const ReportsSchema = mongoose.Schema({
  candidateID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidates",
    required: true
  },
  details: {
    type: String,
    required: true,
  },
  score:{
    type: Number,
    required: true,
  },
  isSelected:{
    type: Boolean,
    required: true,
  }
});

const ReportsModel = mongoose.model("Reports", ReportsSchema);
export default ReportsModel;