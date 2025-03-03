const { Kafka } = require("kafkajs");

const kafka = new Kafka({ clientId: "test-app", brokers: ["localhost:9092"] });
const producer = kafka.producer();

const sendMessage = async () => {
  await producer.connect();
  await producer.send({
    topic: "test-topic",
    messages: [
      { value: "Hello KafkaJS user!" },
      { value: "Hello again!" },
      { value: "Hello for the third time!" },
    ],
  });
  console.log("Messages sent successfully");
  await producer.disconnect();
};

sendMessage();
