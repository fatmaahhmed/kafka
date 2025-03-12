const { Notification } = require("../models/model");

const findAllnotications = async () => {
  try {
    console.log("Finding all notifications");
    const notifications = await Notification.find();
    console.log(notifications);
    return notifications;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
const initialNotifications = [
  {
    user_id: "677c030ae0b82300134b295e",
    type: "Mobser",
    content: "You have a new Mobser notification",
  },
  {
    user_id: "2",
    type: "Naseh",
    content: "You have a new Naseh notification",
  },
  {
    user_id: "3",
    type: "Moean",
    content: "You have a new Moean notification",
  },
];
// Function to insert initial notifications into MongoDB
async function insertInitialNotifications() {
  try {
    await Notification.insertMany(initialNotifications);
    console.log("✅ Initial notifications inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting initial notifications:", error);
  }
}
module.exports = { findAllnotications, insertInitialNotifications };
