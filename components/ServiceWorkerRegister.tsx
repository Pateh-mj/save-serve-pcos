"use client";
import { useEffect } from "react";

// Registers the PWA service worker in production builds only (in dev it would cache stale bundles).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("Service worker registration failed:", err));
  }, []);
  return null;
}
