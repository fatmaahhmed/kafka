// sendNotificationExample.js
const { connectProducer, sendNotification } = require("./producer.js");
(async () => {
  await connectProducer();
  const notification = {
    user_id: "6772d9ebb99a4a0012339769",
    // user_id: "1",
    type: "Naseh",
    content: "HI How are you 52",
    createdAt: Math.abs(Date.now()),
  };

  // check if consumer take message or not
  await sendNotification(notification);
  process.exit(0);
})();
