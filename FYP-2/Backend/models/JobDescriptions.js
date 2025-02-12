import mongoose, { mongo } from "mongoose";

const JobDescriptionsSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true,
  },
  details:{
    type: String,
    required: true,
  },
  hrID:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "HR",
  },
  candidatesApplied:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidates"
  }]
});

const JobDescriptionsModel = mongoose.model("JobDescriptions", JobDescriptionsSchema);
export default JobDescriptionsModel;