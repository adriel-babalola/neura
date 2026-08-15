"use client";

import { useCallback, useSyncExternalStore } from "react";

export type LessonRecord = {
  id: string;
  title: string;
  subject: string;
  focus: string;
  mode: "board" | "story";
  childName: string;
  questionsTotal: number;
  questionsCorrect: number;
  completedAt: string; // ISO date string
  durationMs: number;
};

export type StreakData = {
  current: number;
  longest: number;
  lastDate: string; // ISO date yyyy-mm-dd
};

export type ProgressStats = {
  totalLessons: number;
  totalQuestions: number;
  totalCorrect: number;
  subjectBreakdown: Record<string, number>;
  streak: StreakData;
  weeklyActivity: number[]; // last 7 days lesson count
};

const HISTORY_KEY = "neura:history";
const STREAK_KEY = "neura:streak";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function readHistory(): LessonRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as LessonRecord[]) : [];
  } catch {
    return [];
  }
}

function readStreak(): StreakData {
  if (typeof window === "undefined") return { current: 0, longest: 0, lastDate: "" };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? (JSON.parse(raw) as StreakData) : { current: 0, longest: 0, lastDate: "" };
  } catch {
    return { current: 0, longest: 0, lastDate: "" };
  }
}

function writeHistory(records: LessonRecord[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch { /* ignore */ }
  notify();
}

function writeStreak(data: StreakData) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
  notify();
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function updateStreak(): StreakData {
  const streak = readStreak();
  const today = toDateStr(new Date());
  
  if (streak.lastDate === today) return streak; // already counted today

  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  const isConsecutive = streak.lastDate === yesterday;

  const next: StreakData = {
    current: isConsecutive ? streak.current + 1 : 1,
    longest: 0,
    lastDate: today,
  };
  next.longest = Math.max(streak.longest, next.current);
  writeStreak(next);
  return next;
}

export function addLessonRecord(record: Omit<LessonRecord, "completedAt">) {
  const full: LessonRecord = { ...record, completedAt: new Date().toISOString() };
  const history = readHistory();
  history.unshift(full);
  // Keep last 50
  if (history.length > 50) history.length = 50;
  writeHistory(history);
  updateStreak();
}

export function getProgressStats(): ProgressStats {
  const history = readHistory();
  const streak = readStreak();
  
  const subjectBreakdown: Record<string, number> = {};
  let totalQuestions = 0;
  let totalCorrect = 0;

  history.forEach((r) => {
    subjectBreakdown[r.subject] = (subjectBreakdown[r.subject] || 0) + 1;
    totalQuestions += r.questionsTotal;
    totalCorrect += r.questionsCorrect;
  });

  // Weekly activity (last 7 days)
  const weeklyActivity: number[] = Array(7).fill(0);
  const now = Date.now();
  history.forEach((r) => {
    const daysAgo = Math.floor((now - new Date(r.completedAt).getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo < 7) {
      weeklyActivity[6 - daysAgo]++;
    }
  });

  return {
    totalLessons: history.length,
    totalQuestions,
    totalCorrect,
    subjectBreakdown,
    streak,
    weeklyActivity,
  };
}

// Hook for reactive access
let cachedHistory: LessonRecord[] | null = null;

function snapshotHistory(): LessonRecord[] {
  if (typeof window === "undefined") return [];
  const fresh = readHistory();
  if (JSON.stringify(fresh) !== JSON.stringify(cachedHistory)) {
    cachedHistory = fresh;
  }
  return cachedHistory ?? [];
}

export function useLessonHistory() {
  const history = useSyncExternalStore(subscribe, snapshotHistory, () => []);
  const stats = getProgressStats();
  
  const addRecord = useCallback((record: Omit<LessonRecord, "completedAt">) => {
    addLessonRecord(record);
  }, []);

  return { history, stats, addRecord };
}
