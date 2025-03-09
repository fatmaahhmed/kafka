// sendNotificationExample.js
const { connectProducer, sendNotification } = require("./producer.js");
(async () => {
  await connectProducer();
  const notification = {
    user_id: "677464551337f90012aa40f7",
    // user_id: "1",
    type: "Naseh",
    content: "HI How are you 31",
    createdAt: Math.abs(Date.now()),
  };

  // check if consumer take message or not
  await sendNotification(notification);
  process.exit(0);
})();
