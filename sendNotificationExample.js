// sendNotificationExample.js
const { mongo } = require("mongoose");
const { connectProducer, sendNotification } = require("./producer.js");
(async () => {
  await connectProducer();
  const notification = {
    // convert to mongoDB ObjectId
    // user_id: mongo.ObjectId("677c030ae0b82300134b295e"),
    user_id: "677c030ae0b82300134b295e",
    type: "Naseh",
    content: "8nnd notification",
    createdAt: Math.abs(Date.now()),
  };

  // check if consumer take message or not
  await sendNotification(notification);
  process.exit(0);
})();
