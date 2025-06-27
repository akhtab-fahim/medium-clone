import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No auth header found. Try logging in or registering." });
    }
    const token = authHeader.split(" ")[1];
    try {
        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!verifiedToken) {
            return res.status(401).json({ message: "Token not verified" });
        }
        console.log("Authenticated user ",req.user);
        
        req.user = verifiedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Error verifying token", error: error.message });
    }
}