// sendNotificationExample.js
const { mongo } = require("mongoose");
const { connectProducer, sendNotification } = require("./producer.js");
(async () => {
  await connectProducer();
  const notification = {
    user_id: ["6772d9ebb99a4a0012339769", "67bc570d92aa0370e91cf27a"],
    type: "Mobser",
    content: "Hello from Kafka System 🚀 ",
  };

  // check if consumer take message or not
  await sendNotification(notification);
  process.exit(0);
})();
