import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    // getting token from cookies
    const token = req.cookies.jwt;
    // token is not in cookies
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No Token Provided" });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // if token is expried or Invalid token
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }

    // we have a valid token then process
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not Found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute  middleware", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
