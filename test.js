const WebSocket = require("ws");
const url = require("url");

// import { useEffect, useState } from "react";

// import { io } from "socket.io-client";

// export default function Home() {
//   const [notifications, setNotifications] = useState([]);

//   useEffect(() => {
//     const socket = io("http://localhost:4000"); // الاتصال بالسيرفر

//     socket.on("notification", (message) => {
//       console.log("📩 إشعار جديد:", message);
//       setNotifications((prev) => [...prev, message]); // تحديث الإشعارات
//     });

//     return () => {
//       socket.disconnect(); // فصل الاتصال عند إغلاق الصفحة
//     };
//   }, []);

//   return (
//     <div>
//       <h1>إشعارات الـ Supermarket</h1>
//       <ul>
//         {notifications.map((notif, index) => (
//           <li key={index}>{notif}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", function connection(ws, req) {
  const parameters = url.parse(req.url, true);
  const userId = parameters.query.userId;

  console.log(`User connected with ID: ${userId}`);

  ws.on("message", function incoming(message) {
    console.log(`Received message from user ${userId}: ${message}`);

    // Echo the message back
    ws.send(`Server received your message: ${message}`);
  });

  ws.on("close", function () {
    console.log(`User ${userId} disconnected`);
  });
});

console.log("WebSocket server started on port 8080");
