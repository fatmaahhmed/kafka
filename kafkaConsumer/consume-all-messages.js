const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "supermarket-app",
  // brokers: ["34.47.244.129:9092"],
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "show-all-messages-group" });

const consumeMessages = async () => {
  await consumer.connect();
  console.log("📥 Consumer connected");

  await consumer.subscribe({ topic: "notifications", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(
        `📜 Topic: ${topic} | Partition: ${partition} | Message: ${message.value.toString()}`
      );
    },
  });
};

consumeMessages();
