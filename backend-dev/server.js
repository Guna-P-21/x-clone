import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/auth_routes.js";
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);

// Server run in 8000 port
app.listen(PORT, () => {
  console.log(`Server is Running on Port ${PORT}`);
  connectMongoDB();
});
