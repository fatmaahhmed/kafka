const WebSocket = require("ws");
const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");
//pendeing notfications
const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://tariqeyego:K0tn94fPWbB3XWKR@eyego.6gk2cxc.mongodb.net/?retryWrites=true&w=majority&appName=eyego"
  )
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Function to insert initial notifications into MongoDB
async function insertInitialNotifications() {
  try {
    await Notification.insertMany(initialNotifications);
    console.log("✅ Initial notifications inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting initial notifications:", error);
  }
}
// insertInitialNotifications();

// kafka for consumer
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["34.47.244.129:9092"],
});
const consumer = kafka.consumer({ groupId: "notification-group" });

const wss = new WebSocket.Server({ port: 8083 });

const clients = new Map(); // Map<userId, WebSocket>
const pendingMessages = new Map(); // Map<notificationId, Timeout>
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

//function to save notification when user is offline or connection is lost
async function saveNotification(userId, notification) {
  try {
    await Notification.create({
      id: notification.id,
      userId,
      message: notification.message,
      timestamp: notification.timestamp,
    });
    console.log(`📥 Notification saved for user ${userId}.`);
  } catch (err) {
    console.error(err);
  }
}
// function to send pending notifications
async function sendPendingNotifications(userId, ws) {
  try {
    let notifications = await Notification.find();
    console.log("notifications len", notifications.length);
    // console.log("notifications", notifications);
    // const userNotifications = notifications.filter(
    //   (notif) => notif.userId === userId
    // );
    const userNotifications = await Notification.find({ userId });
    console.log("userNotifications len", userNotifications);

    for (const notification of userNotifications) {
      console.log("notification", notification);
      ws.send(JSON.stringify(notification));
      console.log(
        `📤 Sent pending notification to user ${userId}: "${notification.message}"`
      );
    }
    // Remove sent notifications from the list
    // notifications = notifications.filter((notif) => notif.userId !== userId);
    await Notification.deleteMany({ userId });

    console.log(`🧹 Removed pending notifications for user ${userId}.`);
    notifications = await Notification.find();
    console.log("notifications len", notifications.length);
  } catch (err) {
    console.error(err);
  }
}

wss.on("connection", (ws, req) => {
  const parameters = new URLSearchParams(req.url.split("?")[1]);
  const userId = parameters.get("userId");
  console.log("userId", userId);

  if (!userId) {
    console.log("❌ User ID not provided. Closing connection");
    ws.close();
    return;
  }
  clients.set(userId, ws);
  // shown number of clients connected
  console.log("clients.size", clients.size);
  // console.log("clients", clients);
  console.log(`✅ User ${userId} connected.`);
  // send pending notifications
  sendPendingNotifications(userId, ws).catch(console.error);

  ws.on("message", (message) => {
    try {
      console.log(`📥 Received message from user ${userId}: ${message}`);
      const data = JSON.parse(message);
      // {
      //   type: "ack",
      //   messageId: "notif-001",
      // }
      if (data.type === "ack" && data.messageId) {
        if (pendingMessages.has(data.messageId)) {
          // {
          // "notif-001": Timeout
          // }
          clearTimeout(pendingMessages.get(data.messageId));
          pendingMessages.delete(data.messageId);
          console.log(
            `✅ ACK received for message ${data.messageId} from user ${userId}`
          );
        }
      }
    } catch (err) {
      console.error("Error parsing incoming message:", err);
    }
  });

  ws.on("close", () => {
    console.log(`❌ User ${userId} disconnected.`);
    clients.delete(userId);
  });
});
console.log("WebSocket server started on port 8083");
// function to send notification
function sendMessage(notification, retryCount = 0) {
  //clients=Map<userId, WebSocket>
  // data of the user from map
  const userSocket = clients.get(notification.userId);
  console.log("userSocket", userSocket);

  if (!userSocket || userSocket.readyState !== WebSocket.OPEN) {
    console.log(
      `🔴 User ${notification.userId} is offline. Storing notification.`
    );
    saveNotification(notification.userId, notification);
    return;
  }

  notification.retryCount = retryCount;
  userSocket.send(JSON.stringify(notification));
  console.log(
    `📤 Sent notification to user ${notification.userId}: "${notification.message}"`
  );
  // set the timeout for the message
  const timeout = setTimeout(() => {
    if (retryCount < MAX_RETRIES) {
      console.log(
        `🔄 No ACK for message ${notification.id}. Retrying (Attempt ${
          retryCount + 1
        })...`
      );
      sendMessage(notification, retryCount + 1);
    } else {
      console.log(
        `❌ Failed to deliver message ${notification.id} to user ${notification.userId} after ${MAX_RETRIES} attempts.`
      );
      saveNotification(notification.userId, notification);
    }
  }, RETRY_INTERVAL);

  pendingMessages.set(notification.id, timeout);
}

async function consumeMessages() {
  console.log("🚀 Connecting to Kafka broker...");
  await consumer.connect();
  await consumer.subscribe({ topic: "notifications", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const notification = JSON.parse(message.value.toString());
        console.log(
          `📩 Received notification for user ${notification.userId}: "${notification.message}"`
        );
        notification.id = notification.id || message.offset;
        sendMessage(notification);
      } catch (err) {
        console.error("Error processing Kafka message:", err);
      }
    },
  });
}

consumeMessages().catch(console.error);
console.log("🚀 WebSocket Server running on port 8083.");
