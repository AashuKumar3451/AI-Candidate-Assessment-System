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

// Connect to MongoDB with proper error handling
const connectDB = async () => {
  try {
    await mongoose.connect(URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    });
    console.log(`✅ Connected to MongoDB`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit if database connection fails
  }
};

// Call the connection function
connectDB();

const db = mongoose.connection;
export default db;
