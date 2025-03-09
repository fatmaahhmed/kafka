const WebSocket = require("ws");
const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");
const { Notification } = require("./model");
const User = require("./user.model");
const {
  findAllnotications,
  insertInitialNotifications,
} = require("./findNotfication");

// findAllnotications();
// insertInitialNotifications();

// kafka for consumer
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["34.47.244.129:9092"],
  // brokers: ["localhost:9092"],
});
const consumer = kafka.consumer({ groupId: "notification-group" });

const wss = new WebSocket.Server({ port: 8083 });

const clients = new Map(); // Map<user_id, WebSocket>
const pendingcontents = new Map(); // Map<notificationId, Timeout>
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

//function to save notification when user is offline or connection is lost
async function saveNotification(notification) {
  try {
    console.log("saveNotification is called......");
    // find the user
    // const user = await User.findById(notification.user_id);
    // console.log("user", user);
    console.log("notification", notification);
    // save the notification
    await Notification.create(notification).then((data) => {
      console.log("data", data);
    });
  } catch (err) {
    console.error(err);
  }
}
// function to send pending notifications
async function sendPendingNotifications(user_id, ws) {
  try {
    // let notifications = await Notification.find();
    // console.log("notifications len", notifications.length);
    const userNotifications = await Notification.find({
      // user_id: new mongoose.Types.ObjectId(user_id),
      user_id: user_id,
    });
    console.log("userNotifications len", userNotifications);
    if (userNotifications.length === 0) {
      console.log(`📭 No pending notifications for user ${user_id}.`);
      return;
    }

    for (const notification of userNotifications) {
      if (notification.sent == false) {
        console.log("notification", notification);
        ws.send(JSON.stringify(notification));
        console.log(
          `📤 Sent pending notification to user ${user_id}: "${notification.content}"`
        );
      }
    }
    // update the notifications sent to yes
    await Notification.updateMany(
      // { user_id: new mongoose.Types.ObjectId(user_id) },
      { user_id: user_id },
      { $set: { sent: true } }
    );
  } catch (err) {
    console.error(err);
  }
}

wss.on("connection", (ws, req) => {
  const parameters = new URLSearchParams(req.url.split("?")[1]);
  const user_id = parameters.get("user_id");
  console.log("user_id", user_id);

  if (!user_id) {
    console.log("❌ User ID not provided. Closing connection");
    ws.close();
    return;
  }
  clients.set(user_id, ws);
  // shown number of clients connected
  console.log("✅clients.size", clients.size);
  // console.log("clients", clients);
  console.log(`✅ User ${user_id} connected.`);
  // send pending notifications
  sendPendingNotifications(user_id, ws).catch(console.error);

  ws.on("message", (content) => {
    try {
      console.log(`📥 Received content from user ${user_id}: ${content}`);
      const data = JSON.parse(content);
      // {
      //   type: "ack",
      //   contentId: "notif-001",
      // }
      if (data.type === "ack" && data.contentId) {
        if (pendingcontents.has(data.contentId)) {
          // {
          // "notif-001": Timeout
          // }
          clearTimeout(pendingcontents.get(data.contentId));
          pendingcontents.delete(data.contentId);
          console.log(
            `✅ ACK received for content ${data.contentId} from user ${user_id}`
          );
        }
      }
    } catch (err) {
      console.error("Error parsing incoming content:", err);
    }
  });

  ws.on("close", () => {
    console.log(`❌ User ${user_id} disconnected.`);
    clients.delete(user_id);
    console.log("clients.size", clients.size);
  });
});
console.log("WebSocket server started on port 8083");
// function to send notification
function sendcontent(notification, retryCount = 0) {
  //clients=Map<user_id, WebSocket>
  // data of the user from map
  const userSocket = clients.get(notification.user_id);
  // console.log("userSocket", userSocket);

  if (!userSocket || userSocket.readyState !== WebSocket.OPEN) {
    console.log(
      `🔴 User ${notification.user_id} is offline. Storing notification.`
    );
    // save to DB
    console.log("saveNotification", notification);

    saveNotification(notification);

    return;
  }

  notification.retryCount = retryCount;
  userSocket.send(JSON.stringify(notification));
  console.log(
    `📤 Sent notification to user ${notification.user_id}: "${notification.content}"`
  );
  // set the timeout for the content
  const timeout = setTimeout(() => {
    if (retryCount < MAX_RETRIES) {
      console.log(
        `🔄 No ACK for content ${notification._id}. Retrying (Attempt ${
          retryCount + 1
        })...`
      );
      sendcontent(notification, retryCount + 1);
    } else {
      console.log(
        `❌ Failed to deliver content ${notification._id} to user ${notification.user_id} after ${MAX_RETRIES} attempts.`
      );
      console.log("...notification", notification);
      saveNotification(notification);
    }
  }, RETRY_INTERVAL);

  pendingcontents.set(notification._id, timeout);
}

async function consumeContents() {
  console.log("🚀 Connecting to Kafka broker...");
  await consumer.connect().catch((err) => {
    console.error("❌ Error connecting to Kafka:", err);
    process.exit(1);
  });
  console.log("✅ Connected to Kafka");
  await consumer.subscribe({ topic: "notifications", fromBeginning: false });
  console.log("🔊 Subscribed to notifications topic");
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const notification = JSON.parse(message.value.toString());
        console.log(
          `📩 Received notification for user ${notification.user_id}: "${notification.content}"`
        );
        // set the notification id to the offset
        notification._id = notification._id || message.offset;
        sendcontent(notification);
      } catch (err) {
        console.error("Error processing Kafka message:", err);
      }
    },
  });
}

consumeContents().catch(console.error);
