import mongoose from "mongoose";

const CandidatesSchema = mongoose.Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    resume:{
        data: Buffer,
        contentType: String
    },
    coverLetter:{
        type: String,
    },
    jobDescriptionAppliedFor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobDescriptions'
    },
    isSelectedForTest:{
        type: Boolean,
        default: false,
    },
    isSelectedForInterview:{
        type: Boolean,
        default: false,
    },
    testScore:{
        type: Number
    },
    testReport:{
        type: String
    },
    resumeScore:{
        type: Number
    },
    resumeText:{
        type: String
    }
});

const CandidatesModel = mongoose.model("Candidates", CandidatesSchema);
export default CandidatesModel;