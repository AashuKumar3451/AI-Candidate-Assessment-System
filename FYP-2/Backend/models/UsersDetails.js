import mongoose from "mongoose";
import dotenv, { configDotenv } from "dotenv";
import bcrypt from "bcrypt";

configDotenv({path: "..//env"});

const UsersDetailsSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    phone:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ["hr", "candidate", "admin"],
        default: "candidate",
    }
});

UsersDetailsSchema.pre("save", async function(next){
    try {
        if(!this.isModified("password")){
            return next();
        }
        const saltRounds = parseInt(process.env.SALT_ROUNDS, 10);
        const salt = await bcrypt.genSalt(saltRounds);
        const hashPass = await bcrypt.hash(this.password, salt);
        this.password = hashPass;
        next();
    } catch (error) {
        console.log(`Error Occured: ${error}`);
    }
});

UsersDetailsSchema.methods.comparePass = async function(candidatePass){
    try {
        return await bcrypt.compare(candidatePass, this.password)
    } catch (error) {
        console.log(`Error Occured: ${error}`);
    }
}

const UsersDetailsModel = mongoose.model("UsersDetails", UsersDetailsSchema);
export default UsersDetailsModel;