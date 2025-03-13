const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["34.47.244.129:9092"],
  // brokers: ["localhost:9092"],
});
const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
  console.log("✅ Kafka Producer Connected");
}

async function sendNotification(notification) {
  // Example notification: { user_id,type,content }
  const { user_id, ...rest } = notification;
  const notfications = user_id.map((id) => ({
    user_id: id,
    ...rest,
  }));
  for (const notif of notfications) {
    try {
      console.log(`📤 Sending notification for user ${notif.user_id}`);
      await producer.send({
        topic: "notifications",
        messages: [{ key: notif.user_id, value: JSON.stringify(notif) }],
      });
      console.log(`📩 Notification sent for user ${notif.user_id}`);
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  }
}
// sendnotificationExample.js

module.exports = { connectProducer, sendNotification };
