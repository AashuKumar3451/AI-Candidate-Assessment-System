import { Router } from "express";
const router = Router();
import { generateJWTToken } from "../jwt.js";
import UserDetailsModel from "../models/UsersDetails.js";
import CandidatesModel from "../models/Candidates.js";
import HRModel from "../models/HR.js";

router.post("/signup", async (req, res) => {
  try {
    const userData = req.body;
    const user = new UserDetailsModel(userData);
    if (user.role === "admin") {
      const admin = await UserDetailsModel.findOne({ role: "admin" });
      if (admin) {
        return res.status(400).json({ message: "Admin already exists." });
      }
    }
    const response = await user.save();
    if (!response) {
      return res.status(201).json("Error saving the user.");
    }
    if(user.role === "hr"){
      const HR = new HRModel();
      HR.userID = response.id;
      await HR.save();
    }
    const token = generateJWTToken({ id: response.id });
    res.status(200).json({ user: response, token: token });
  } catch (error) {
    console.log("Error Occured", error);
    res.status(401).json({ err: error });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserDetailsModel.findOne({ email: email });
    if (!user) {
      return res.status(400).json("Invalid Username or Password.");
    }
    if (!(await user.comparePass(password))) {
      return res.status(400).json("Invalid Username or Password.");
    }
    const token = generateJWTToken({ id: user.id });
    res.status(200).json({ user: user, token: token });
  } catch (error) {
    console.log("Error Occured", error);
    res.status(401).json({ err: error });
  }
});

export default router;
