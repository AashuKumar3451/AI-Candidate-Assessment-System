/*
import express from 'express';
import dotenv, { configDotenv } from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';

import db from './db.js';
import authRoutes from "./Routes/Authorizations.js";
import jdRoutes from "./Routes/JobDescriptions.js";
import testRoutes from "./Routes/Test.js";
import reportsRoutes from "./Routes/Reports.js";

import {jwtAuthMiddleware} from "./jwt.js"

const app = express();
configDotenv({path: ".env"});
const PORT = process.env.PORT;
app.use(bodyParser.json());

app.use("/auth", authRoutes);
app.use("/jd", jwtAuthMiddleware, jdRoutes);
app.use("/test", jwtAuthMiddleware, testRoutes);
app.use("/report", jwtAuthMiddleware, reportsRoutes);
app.get('/', (req,res)=>{
    res.status(200).json({message: "Hello There!"});
});

app.listen(PORT, ()=>{
    console.log(`App is listening at ${PORT}`);
});

*/

import express from 'express';
import dotenv, { configDotenv } from 'dotenv';
import cors from 'cors'; // ✅ Add this
import path from 'path';
import bodyParser from 'body-parser';

import db from './db.js';
import authRoutes from "./Routes/Authorizations.js";
import jdRoutes from "./Routes/JobDescriptions.js";
import testRoutes from "./Routes/Test.js";
import reportsRoutes from "./Routes/Reports.js";
import { jwtAuthMiddleware } from "./jwt.js";

const app = express();
configDotenv({ path: ".env" });

app.use(cors({
  origin: 'http://localhost:8081', // ✅ Allow frontend
  credentials: true
}));
//app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));



app.use("/auth", authRoutes);
app.use('/api/auth', authRoutes);
app.use("/jd", jwtAuthMiddleware, jdRoutes);
app.use("/test", jwtAuthMiddleware, testRoutes);
app.use("/report", jwtAuthMiddleware, reportsRoutes);
app.use("/api/jd", jwtAuthMiddleware, jdRoutes);
app.use("/api/test", jwtAuthMiddleware, testRoutes);
app.use("/api/report", jwtAuthMiddleware, reportsRoutes);


app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello There!" });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`App is listening at ${PORT}`);
});

