// sendNotificationExample.js
const { connectProducer, sendNotification } = require("./producer.js");

(async () => {
  await connectProducer();
  // Example notification object
  const notification = {
    id: "notif-001",
    userId: "user1",
    message: "Your order has been shippedd!",
    timestamp: Date.now(),
  };
  await sendNotification(notification);
  process.exit(0);
})();
