import { useEffect, useState } from "react";

import { io } from "socket.io-client";

export default function Home() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:4000"); // الاتصال بالسيرفر

    socket.on("notification", (message) => {
      console.log("📩 إشعار جديد:", message);
      setNotifications((prev) => [...prev, message]); // تحديث الإشعارات
    });

    return () => {
      socket.disconnect(); // فصل الاتصال عند إغلاق الصفحة
    };
  }, []);

  return (
    <div>
      <h1>إشعارات الـ Supermarket</h1>
      <ul>
        {notifications.map((notif, index) => (
          <li key={index}>{notif}</li>
        ))}
      </ul>
    </div>
  );
}
