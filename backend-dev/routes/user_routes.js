import express from "express";
import { protectRoute } from "../middleware/protecRoute.js";
import {
  getSuggestedUsers,
  getUserProfile,
  followUnfollowUser,
  updateUser,
} from "../controllers/user_contoller.js";

// create Router
const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/update", protectRoute, updateUser);

export default router;
