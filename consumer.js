// consumer.js
const { Kafka } = require("kafkajs");
const WebSocket = require("ws");
const http = require("http");

const kafka = new Kafka({ clientId: "test-app", brokers: ["localhost:9092"] });
const producer = kafka.producer();

const startServer = async () => {
  await producer.connect();
  console.log("Kafka Producer connected");

  const server = http.createServer();
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data);
        await producer.send({
          topic: "notifications",
          messages: [{ value: JSON.stringify(message) }],
        });
        console.log("Message sent:", message);

        ws.send(
          JSON.stringify({
            status: "success",
            message: "Message sent to Kafka",
          })
        );
      } catch (error) {
        console.error("Error:", error);
        ws.send(JSON.stringify({ status: "error", message: error.message }));
      }
    });

    ws.on("close", () => console.log("Client disconnected"));
  });

  server.listen(8081, () =>
    console.log("WebSocket server is running on port 8081")
  );
};

startServer();
