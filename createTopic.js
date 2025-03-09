const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "supermarket-app",
  brokers: ["34.47.244.129:9092"], // Replace with your Kafka broker
});

const createTopic = async () => {
  const admin = kafka.admin();
  await admin.connect();
  console.log("✅ Admin connected");

  await admin.createTopics({
    topics: [
      {
        topic: "orders",
        numPartitions: 3, // Number of partitions
        replicationFactor: 1, // Number of replicas (keep 1 for local setup)
      },
    ],
  });

  console.log("🎉 Topic 'orders' created successfully");
  await admin.disconnect();
};

createTopic();
