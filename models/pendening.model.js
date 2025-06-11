const e = require("express");
const mongoose = require("mongoose");
// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://
  )
  .then(() => console.log("✅ Connected to MongoDB from pendeing "))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
const pendingNotfication = new mongoose.Schema({
  _id: {
    type: String,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: "User",
    // type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Mobser", "Naseh", "Moean"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  sent: {
    type: Boolean,
    default: false,
  },
});
//export pendingNotification model
const pendingNotification = mongoose.model(
  "pendingNotification",
  pendingNotfication
);
exports.pendingNotification = pendingNotification;
