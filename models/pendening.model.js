const e = require("express");
const mongoose = require("mongoose");
// Connect to MongoDB
mongoose
  .connect(
    "mongodb://eyego-client:ZXllZ28tY2xpZW50QGV5ZWdvLmFp@34.18.0.208:27017,34.18.87.101:27017/eyego?authMechanism=DEFAULT&authSource=admin&replicaSet=rs0"
  )
  .then(() => console.log("✅ Connected to MongoDB"))
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
