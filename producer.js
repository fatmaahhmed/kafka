// producer.js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({ clientId: "test-app", brokers: ["localhost:9092"] });
const producer = kafka.producer();

const runProducer = async () => {
  await producer.connect();

  setInterval(async () => {
    await producer.send({
      topic: "notifications",
      messages: [
        { value: `Hello KafkaJS user! - ${new Date().toISOString()}` },
      ],
    });
    console.log(
      `Message sent Hello KafkaJS user! - ${new Date().toISOString()}`
    );
  }, 5000);
  process.on("SIGINT", async () => {
    await producer.disconnect();
    console.log("Producer disconnected");
    process.exit(0);
  });
};

runProducer();
