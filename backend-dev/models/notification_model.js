import mongoose from "mongoose";

// Create Schema
const notificationSchema = new mongoose.Schema(
  {
    // this notification will be send from user
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["follow", "like"],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//create Model
const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
