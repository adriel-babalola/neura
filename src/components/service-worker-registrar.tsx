"use client";

import { useEffect } from "react";

/**
 * Registers the offline shell worker.
 *
 * Skipped in development: caching dev bundles produces stale-asset bugs that
 * look like application bugs. Production only, and failures are silent because
 * a missing worker must never stop the app from working online.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          /* offline support is a bonus, not a requirement */
        });
    };

    // Register after load so the worker never competes with first paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}