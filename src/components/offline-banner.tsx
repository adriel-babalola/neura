"use client";

import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";

/**
 * Connectivity banner.
 *
 * Deliberately reassuring rather than alarming: for a child, "you are offline"
 * should not feel like something broke. A pre-authored lesson is always
 * available, so the useful thing to say is that learning carries on.
 */
export default function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[100] flex items-center justify-center gap-2 bg-warn px-4 py-2 text-center text-xs font-medium text-white"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>
        You are offline. Lessons still work &mdash; Neura will pick up again when
        you reconnect.
      </span>
    </div>
  );
}