// sendNotificationExample.js
const { connectProducer, sendNotification } = require("./producer.js");
(async () => {
  await connectProducer();
  const notification = {
    user_id: "6772d9ebb99a4a0012339769",
    type: "Naseh",
    content: "HI How are you 2",
  };
  // check if consumer take message or not
  await sendNotification(notification);
  process.exit(0);
})();
