// Packages
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

// Routes
import authRoutes from "./routes/auth_route.js";
import userRoutes from "./routes/user_route.js";
import postRoutes from "./routes/post_route.js";
import notificationRoutes from "./routes/notification_route.js";

// Utility Functions
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;

// is an Regular function inbetween req & res
app.use(express.json()); // to parse req.body
app.use(express.urlencoded({ extended: true })); // to parse form data(urlencoded)

// able to reqest cookies
app.use(cookieParser());

app.use("/api/auth", authRoutes); // Call auth Routes
app.use("/api/users", userRoutes); // call users Routes
app.use("/api/posts", postRoutes); //call posts Routes
app.use("/api/notifications", notificationRoutes); // call api notification Routes

// Server run in 8000 port
app.listen(PORT, () => {
  console.log(`Server is Running on Port ${PORT}`);
  connectMongoDB();
});
