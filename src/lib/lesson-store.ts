"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Lesson } from "@/lib/types";
import { fallbackLesson } from "@/lib/fallback";

const KEY = "neura:lesson";
const listeners = new Set<() => void>();

let cached: Lesson | null = null;
let cachedRaw: string | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function readSnapshot(): Lesson | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    const parsed = raw ? (JSON.parse(raw) as Lesson) : null;
    if (parsed && (!Array.isArray(parsed.scenes) || !Array.isArray(parsed.questions))) {
      cached = null;
      return null;
    }
    cached = parsed;
    return cached;
  } catch {
    cachedRaw = null;
    cached = null;
    return null;
  }
}

function write(value: Lesson) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  cached = value;
  cachedRaw = JSON.stringify(value);
  listeners.forEach((l) => l());
}

export function useLessonStore() {
  const lesson = useSyncExternalStore(subscribe, readSnapshot, readSnapshot);
  const saveLesson = useCallback((l: Lesson) => write(l), []);
  return { lesson: lesson ?? fallbackLesson, saveLesson };
}
