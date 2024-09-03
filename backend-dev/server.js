import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/auth_routes.js";
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// is an Regular function inbetween req & res
app.use(express.json()); // to parse req.body
app.use(express.urlencoded({ extended: true })); // to parse form data(urlencoded)

// able to reqest cookies
app.use(cookieParser());

// Call Routes
app.use("/api/auth", authRoutes);

// Server run in 8000 port
app.listen(PORT, () => {
  console.log(`Server is Running on Port ${PORT}`);
  connectMongoDB();
});
