const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "supermarket-app",
  brokers: ["34.47.244.129:9092"],
  // brokers: ["localhost:9092"],
});

const listTopics = async () => {
  const admin = kafka.admin();
  await admin.connect();
  const topics = await admin.listTopics();
  console.log("📜 Available Topics:", topics);
  await admin.disconnect();
};

listTopics();
// 34.47.244.129:9092
