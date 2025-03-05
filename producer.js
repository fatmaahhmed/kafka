// notificationService.js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["34.47.244.129:9092"],
});
const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
  console.log("✅ Kafka Producer Connected");
}

async function sendNotification(notification) {
  // Example notification: { id, userId, message, timestamp }
  try {
    await producer.send({
      topic: "notifications",
      messages: [
        { key: notification.userId, value: JSON.stringify(notification) },
      ],
    });
    console.log(`📩 Notification sent for user ${notification.userId}`);
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}
// sendnotificationExample.js

module.exports = { connectProducer, sendNotification };
