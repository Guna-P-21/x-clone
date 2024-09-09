import express from "express";
import { protectRoute } from "../middleware/protecRoute.js";
import {
  deleteNotifications,
  //deleteNotificatin,
  getNotifications,
} from "../controllers/notification_controller.js";

const router = express.Router();

// get all notification
router.get("/", protectRoute, getNotifications);
router.delete("/", protectRoute, deleteNotifications); // delete notification
//router.delete("/:id", protectRoute, deleteNotification); // delete single notification

export default router;
