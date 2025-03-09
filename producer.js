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
  try {
    console.log(`📤 Sending notification for user ${notification.user_id}`);
    await producer.send({
      topic: "notifications",
      messages: [
        { key: notification.user_id, value: JSON.stringify(notification) },
      ],
    });
    console.log(`📩 Notification sent for user ${notification.user_id}`);
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}

module.exports = { connectProducer, sendNotification };
