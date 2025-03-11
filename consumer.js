const WebSocket = require("ws");
const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");
const { Notification } = require("./model");
const User = require("./user.model");
const { pendingNotification } = require("./pendening.model");

// Constants
const WS_PORT = 8083;
const KAFKA_BROKER = "34.47.244.129:9092";
const KAFKA_TOPIC = "notifications";
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

// Configuration
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [KAFKA_BROKER],
});

// State management
const activeClients = new Map(); // Map<user_id, WebSocket>
const pendingAcknowledgements = new Map(); // Map<notificationId, Timeout>

/**
 * Saves notification to database when user is offline or connection is lost
 * @param {Object} notification - The notification to save
 */
async function saveNotification(notification) {
  try {
    // Remove the _id field if it exists
    const cleanNotification = { ...notification };
    delete cleanNotification._id;

    console.log(`Saving notification for user ${cleanNotification.user_id} 📥`);

    const savedNotification = await pendingNotification.create(
      cleanNotification
    );
    console.log(`Notification saved with ID: ${savedNotification._id} ✅`);

    return savedNotification;
  } catch (error) {
    console.error(`Failed to save notification: ${error.message} ❌`);
    throw error;
  }
}

/**
 * Sends pending notifications to user when they reconnect
 * @param {string} userId - User ID
 * @param {WebSocket} ws - WebSocket connection
 */
async function sendPendingNotifications(userId, ws) {
  try {
    const userNotifications = await pendingNotification.find({
      user_id: userId,
    });
    console.log("userNotifications.length...", userNotifications.length);

    if (userNotifications.length === 0) {
      console.log(`No pending notifications for user ${userId} 📭`);
      return;
    }

    console.log(
      `Sending ${userNotifications.length} pending notifications to user ${userId} 📤`
    );

    for (const notification of userNotifications) {
      notification.length = userNotifications.length;
      ws.send(JSON.stringify(notification));
      console.log(
        `Sent pending notification ID ${notification._id} to user ${userId} 📤`
      );
    }

    // Delete the pending notifications after successful sending
    const deleteResult = await pendingNotification.deleteMany({
      user_id: userId,
    });
    console.log(
      `Deleted ${deleteResult.deletedCount} pending notifications for user ${userId} 🗑️`
    );
  } catch (error) {
    console.error(`Error sending pending notifications: ${error.message} ❌`);
  }
}

/**
 * Sends a notification to a user with retry logic
 * @param {Object} notification - The notification to send
 * @param {number} retryCount - Current retry attempt
 */
function sendNotification(notification, retryCount = 0) {
  const userId = notification.user_id;
  const userSocket = activeClients.get(userId);

  // Check if user is connected and socket is open
  if (!userSocket || userSocket.readyState !== WebSocket.OPEN) {
    console.log(
      `User ${userId} is offline. Storing notification for later delivery. 📦`
    );
    saveNotification(notification).catch((error) =>
      console.error(`Failed to store notification: ${error.message} ❌`)
    );
    return;
  }

  // Add retry count to track attempts
  const notificationWithRetry = { ...notification, retryCount };

  try {
    // Send the notification
    userSocket.send(JSON.stringify(notificationWithRetry));
    console.log(
      `Sent notification ID ${notification._id} to user ${userId} (Attempt: ${
        retryCount + 1
      }) 📩`
    );

    // Set timeout for acknowledgement
    const timeout = setTimeout(() => {
      if (retryCount < MAX_RETRIES) {
        console.log(
          `No acknowledgement for notification ${
            notification._id
          }. Retrying (Attempt ${retryCount + 1}/${MAX_RETRIES}) 🔄`
        );
        sendNotification(notification, retryCount + 1);
      } else {
        console.log(
          `Failed to deliver notification ${notification._id} to user ${userId} after ${MAX_RETRIES} attempts ❌`
        );
        saveNotification(notification).catch((error) =>
          console.error(
            `Failed to store notification after retries: ${error.message} ❌`
          )
        );
      }
    }, RETRY_INTERVAL);

    pendingAcknowledgements.set(notification._id, timeout);
  } catch (error) {
    console.error(`Error sending notification: ${error.message} ❌`);
    saveNotification(notification).catch((err) =>
      console.error(
        `Failed to store notification after send error: ${err.message} ❌`
      )
    );
  }
}

/**
 * Initialize WebSocket server
 */
function initializeWebSocketServer() {
  const wss = new WebSocket.Server({ port: WS_PORT });

  wss.on("connection", handleWebSocketConnection);

  console.log(`WebSocket server started on port ${WS_PORT} 🚀`);
  return wss;
}

/**
 * Handle new WebSocket connections
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} req - The HTTP request
 */
function handleWebSocketConnection(ws, req) {
  // Parse user ID from query parameters
  const parameters = new URLSearchParams(req.url.split("?")[1] || "");
  const userId = parameters.get("user_id");

  if (!userId) {
    console.log("Connection rejected: Missing user_id parameter ❌");
    ws.close(1003, "User ID not provided");
    return;
  }

  // Register the client
  activeClients.set(userId, ws);
  console.log(
    `User ${userId} connected (Total active connections: ${activeClients.size}) 🟢`
  );

  // Send any pending notifications
  sendPendingNotifications(userId, ws).catch((error) =>
    console.error(`Error with pending notifications: ${error.message} ❌`)
  );

  // Set up event handlers
  ws.on("message", (message) => handleClientMessage(userId, message, ws));
  ws.on("close", () => handleClientDisconnect(userId));
  ws.on("error", (error) =>
    console.error(`WebSocket error for user ${userId}: ${error.message} ❌`)
  );
}

/**
 * Handle messages from clients
 * @param {string} userId - User ID
 * @param {string} message - Message received
 * @param {WebSocket} ws - WebSocket connection
 */
function handleClientMessage(userId, message, ws) {
  try {
    const data = JSON.parse(message);
    console.log(
      `Received message from user ${userId}: ${JSON.stringify(data)} 📥 `
    );

    // Handle acknowledgement
    if (data.type === "ack" && data.contentId) {
      const timeout = pendingAcknowledgements.get(data.contentId);

      if (timeout) {
        clearTimeout(timeout);
        pendingAcknowledgements.delete(data.contentId);
        console.log(
          `Acknowledgement received for notification ${data.contentId} from user ${userId} ✅`
        );
      }
    }
  } catch (error) {
    console.error(
      `Error parsing message from user ${userId}: ${error.message}`
    );
  }
}

/**
 * Handle client disconnections
 * @param {string} userId - User ID
 */
function handleClientDisconnect(userId) {
  activeClients.delete(userId);
  console.log(
    `User ${userId} disconnected (Remaining connections: ${activeClients.size}) 🔴`
  );
}

/**
 * Initialize and run Kafka consumer
 */
async function initializeKafkaConsumer() {
  const consumer = kafka.consumer({ groupId: "notification-group" });

  try {
    console.log("Connecting to Kafka broker... 🚪");
    await consumer.connect();
    console.log("Connected to Kafka broker successfully ✅");

    await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });
    console.log(`Subscribed to Kafka topic: ${KAFKA_TOPIC} 🔊`);

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const notification = JSON.parse(message.value.toString());
          console.log(
            `Received notification from Kafka for user ${notification.user_id} Content: ${notification.content} 📩
            `
          );

          // Ensure notification has an ID
          notification._id = notification._id || `kafka-${message.offset} `;

          // Send the notification
          sendNotification(notification);
        } catch (error) {
          console.error(`Error processing Kafka message: ${error.message} ❌`);
        }
      },
    });

    return consumer;
  } catch (error) {
    console.error(`Kafka consumer error: ${error.message} ❌`);
    throw error;
  }
}

/**
 * Main function to start the application
 */
async function main() {
  try {
    // Initialize WebSocket server
    const wss = initializeWebSocketServer();

    // Initialize Kafka consumer
    const consumer = await initializeKafkaConsumer();

    // Setup graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Shutting down gracefully... 🛑");

      try {
        await consumer.disconnect();
        wss.close();
        process.exit(0);
      } catch (error) {
        console.error(`Error during shutdown: ${error.message} ❌`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error(`Application startup failed: ${error.message} ❌`);
    process.exit(1);
  }
}

// Start the application
main().catch(console.error);
