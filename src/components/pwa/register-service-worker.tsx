"use client";

import { useEffect } from "react";

/** Registra SW solo in production (F2-06). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const run = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[pwa] SW register failed", err);
      });
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
  }, []);
  return null;
}
