"use client";

import { useCallback, useEffect, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  try {
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
}

export function usePushNotifications(userId: string | null, toast: (message: string) => void) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const [pushEnabled, setPushEnabled] = useState(false);
  const [registering, setRegistering] = useState(false);

  const registerPush = useCallback(async (showErrorToast = false) => {
    if (!userId || typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      return false;
    }

    if (Notification.permission !== "granted") {
      setPermission(Notification.permission);
      if (showErrorToast) {
        toast("Ative as notificações no navegador para receber lembretes.");
      }
      return false;
    }

    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.projectId ||
      !firebaseConfig.messagingSenderId ||
      !firebaseConfig.appId ||
      !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    ) {
      if (showErrorToast) {
        toast("Configuração de Firebase incompleta. Configure as variáveis de ambiente de push.");
      }
      return false;
    }

    setRegistering(true);
    try {
      const app = getFirebaseApp();
      const messaging = getMessaging(app);

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const readyRegistration = await navigator.serviceWorker.ready;
      readyRegistration.active?.postMessage({
        type: "FCM_INIT",
        config: firebaseConfig,
      });

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: readyRegistration,
      });

      if (!token) {
        if (showErrorToast) {
          toast("Não foi possível ativar notificações neste dispositivo.");
        }
        setPushEnabled(false);
        return false;
      }

      const response = await fetch("/api/notifications/register-push", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, platform: "web", deviceName: window.navigator.userAgent }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        if (showErrorToast) {
          toast(data?.error || "Falha ao salvar seu dispositivo para notificações.");
        }
        setPushEnabled(false);
        return false;
      }

      setPushEnabled(true);
      return true;
    } catch (error) {
      console.error("Push registration failed:", error);
      if (showErrorToast) {
        toast("Falha ao ativar notificações. Tente novamente.");
      }
      setPushEnabled(false);
      return false;
    } finally {
      setRegistering(false);
    }
  }, [toast, userId]);

  const requestPermissionAndEnable = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission !== "granted") return false;
    return registerPush(true);
  }, [registerPush]);

  useEffect(() => {
    if (!userId || typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      return;
    }

    setPermission(Notification.permission);
    if (Notification.permission === "granted") {
      void registerPush(false);
    }
  }, [registerPush, userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const app = getFirebaseApp();
      const messaging = getMessaging(app);
      return onMessage(messaging, (payload) => {
        if (payload.notification?.title) {
          toast(`${payload.notification.title} — ${payload.notification.body || ""}`);
        }
      });
    } catch (error) {
      console.error("Push onMessage setup failed:", error);
      return;
    }
  }, [toast, userId]);

  return {
    permission,
    pushEnabled,
    registering,
    requestPermissionAndEnable,
    retryPushRegistration: () => registerPush(true),
  };
}
