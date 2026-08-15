"use client";

import { useSyncExternalStore } from "react";

let hydrated = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  hydrated = true;
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getServerSnapshot() {
  return false;
}

function getSnapshot() {
  return hydrated;
}

export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
