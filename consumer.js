const { Kafka } = require("kafkajs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const kafka = new Kafka({ clientId: "test-app", brokers: ["localhost:9092"] });
const consumer = kafka.consumer({ groupId: "test-group" });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // السماح لجميع الدومينات
});

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "notifications", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const notification = message.value.toString();
      console.log(`📩 New Notification: ${notification}`);
      io.emit("notification", notification);
    },
  });
};

run().catch(console.error);

server.listen(4000, () => console.log("🚀 WebSockets Server on port 4000"));
