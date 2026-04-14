importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js");

let messaging = null;

self.addEventListener("message", async (event) => {
  if (event.data?.type !== "FCM_INIT") return;
  if (!messaging) {
    firebase.initializeApp(event.data.config);
    messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || "Servos";
      const options = {
        body: payload.notification?.body || "Você tem uma nova mensagem.",
        icon: "/favicon.ico",
        data: payload.data || {},
      };
      self.registration.showNotification(title, options);
    });
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.notification?.title || "Servos";
  const options = {
    body: payload.notification?.body || "Você tem uma nova mensagem.",
    icon: "/favicon.ico",
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const actionUrl = event.notification?.data?.click_action || event.notification?.data?.actionUrl || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(actionUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(actionUrl);
      }
      return null;
    })
  );
});
