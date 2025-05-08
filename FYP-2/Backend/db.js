/*
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
export default db
*/

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // ✅ This automatically loads `.env` from project root

const URL = process.env.DB_LOCAL_URL;

if (!URL) {
  throw new Error("DB_LOCAL_URL not defined in .env");
}

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log(`✅ Connected to MongoDB at: ${URL}`);
})
.catch((error) => {
  console.error(`❌ MongoDB connection error: ${error.message}`);
});

const db = mongoose.connection;
export default db;
