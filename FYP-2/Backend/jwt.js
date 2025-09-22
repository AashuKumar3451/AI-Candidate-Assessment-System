import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv({path: "../.env"});

export const jwtAuthMiddleware = (req, res, next)=>{
    if(!req.headers.authorization){
        return res.status(401).json("Invalid token.");
    }
    const token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.status(401).send("Unauthorized");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userPayload = decoded;
        next();
    } catch (error) {
        console.log("JWT Error:", error.message);
        return res.status(401).json({error: 'Invalid token'});
    }
}

export const generateJWTToken = (payload)=>{
    return jwt.sign(payload, process.env.JWT_SECRET_KEY);
}