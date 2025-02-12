import mongoose from "mongoose";
import dotenv, { configDotenv } from "dotenv";

configDotenv({path: "../.env"});
const URL = process.env.DB_LOCAL_URL;

mongoose.connect(URL).then(()=>{
    console.log(`Server is connected to the PORT: ${URL}`);
}).catch((error)=>{
    console.log(`Error Occured: ${error}`);
})

const db = mongoose.connection;
export default db;