// sendNotificationExample.js
const { connectProducer, sendNotification } = require("./producer.js");
(async () => {
  await connectProducer();
  const notification = {
    user_id: "677464551337f90012aa40f7",
    type: "Naseh",
    content: "HI How are you 7 ",
    createdAt: Date.now(),
  };
  // check if consumer take message or not
  await sendNotification(notification);
  process.exit(0);
})();
