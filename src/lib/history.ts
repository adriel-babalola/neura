"use client";

import { useCallback, useSyncExternalStore } from "react";

export type LessonRecord = {
  id: string;
  title: string;
  subject: string;
  focus: string;
  mode: "story";
  childName: string;
  questionsTotal: number;
  questionsCorrect: number;
  /** Questions the child needed a hint or deeper hint for. Optional for older records. */
  hintsUsed?: number;
  completedAt: string; // ISO date string
  durationMs: number;
};

export type StreakData = {
  current: number;
  longest: number;
  lastDate: string; // local yyyy-mm-dd
};

export type ProgressStats = {
  totalLessons: number;
  totalQuestions: number;
  totalCorrect: number;
  /** Questions answered correctly without any hint. */
  firstTryCorrect: number;
  subjectBreakdown: Record<string, number>;
  streak: StreakData;
  /** Lesson count per day, Monday first, for the current calendar week. */
  weeklyActivity: number[];
};

const HISTORY_KEY = "neura:history";
const STREAK_KEY = "neura:streak";
const MAX_RECORDS = 50;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Local calendar date as yyyy-mm-dd.
 *
 * Deliberately not `toISOString().slice(0, 10)`: that is UTC, so a lesson
 * finished at 00:30 on Monday local time is filed under Sunday and vanishes
 * from the week. Day boundaries have to match the parent's calendar.
 */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Midnight of the Monday starting the week that `d` falls in. */
function startOfWeek(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = start.getDay(); // 0 = Sunday
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
  return start;
}

function isRecord(value: unknown): value is LessonRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.title === "string" &&
    typeof r.subject === "string" &&
    typeof r.focus === "string" &&
    typeof r.childName === "string" &&
    typeof r.questionsTotal === "number" &&
    typeof r.questionsCorrect === "number" &&
    typeof r.completedAt === "string" &&
    !Number.isNaN(Date.parse(r.completedAt))
  );
}

function readHistory(): LessonRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything corrupt rather than letting one bad row break the dashboard.
    return parsed.filter(isRecord).slice(0, MAX_RECORDS);
  } catch {
    return [];
  }
}

function readStreak(): StreakData {
  if (typeof window === "undefined") return { current: 0, longest: 0, lastDate: "" };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, longest: 0, lastDate: "" };
    const parsed = JSON.parse(raw) as Partial<StreakData>;
    const current = typeof parsed.current === "number" ? Math.max(0, parsed.current) : 0;
    const longest = typeof parsed.longest === "number" ? Math.max(current, parsed.longest) : current;
    const lastDate = typeof parsed.lastDate === "string" ? parsed.lastDate : "";
    return { current, longest, lastDate };
  } catch {
    return { current: 0, longest: 0, lastDate: "" };
  }
}

function writeHistory(records: LessonRecord[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch {
    /* storage full or blocked; keep the in-memory session usable */
  }
  notify();
}

function writeStreak(data: StreakData) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
  notify();
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function updateStreak(): StreakData {
  const streak = readStreak();
  const today = dateKey();

  if (streak.lastDate === today) return streak; // already counted today
  if (streak.lastDate === shiftDate(today, -1)) {
    const next: StreakData = {
      current: streak.current + 1,
      longest: streak.longest,
      lastDate: today,
    };
    next.longest = Math.max(next.longest, next.current);
    writeStreak(next);
    return next;
  }
  // Anything else (gap, first lesson, or a backwards clock) restarts at 1.
  const next: StreakData = { current: 1, longest: streak.longest, lastDate: today };
  writeStreak(next);
  return next;
}

export function addLessonRecord(record: Omit<LessonRecord, "completedAt">) {
  const full: LessonRecord = { ...record, completedAt: new Date().toISOString() };
  const history = readHistory();
  history.unshift(full);
  if (history.length > MAX_RECORDS) history.length = MAX_RECORDS;
  writeHistory(history);
  updateStreak();
}

/** Wipe progress. Used by the parent dashboard reset action. */
export function clearLessonHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(STREAK_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

export function getProgressStats(): ProgressStats {
  const history = readHistory();
  const streak = readStreak();

  const subjectBreakdown: Record<string, number> = {};
  let totalQuestions = 0;
  let totalCorrect = 0;

  // Questions answered right on the first attempt: the only accuracy signal that
  // is not inflated by hints, so it is what drives mastery.
  let firstTryCorrect = 0;

  for (const r of history) {
    subjectBreakdown[r.subject] = (subjectBreakdown[r.subject] || 0) + 1;
    totalQuestions += r.questionsTotal;
    totalCorrect += r.questionsCorrect;
    firstTryCorrect += r.questionsCorrect - (r.hintsUsed ?? 0);
  }

  // Calendar week, Monday first, matching the labels on the dashboard.
  const weeklyActivity: number[] = Array(7).fill(0);
  const mondayMs = startOfWeek(new Date()).getTime();
  for (const r of history) {
    const completed = new Date(r.completedAt);
    if (Number.isNaN(completed.getTime())) continue;
    // Only lessons in the same calendar week as today belong on this chart.
    if (startOfWeek(completed).getTime() !== mondayMs) continue;
    const slot = Math.floor((completed.getTime() - mondayMs) / 86400000);
    if (slot >= 0 && slot < 7) weeklyActivity[slot]++;
  }

  return {
    totalLessons: history.length,
    totalQuestions,
    totalCorrect,
    firstTryCorrect: Math.max(0, Math.min(firstTryCorrect, totalQuestions)),
    subjectBreakdown,
    streak,
    weeklyActivity,
  };
}

// useSyncExternalStore requires a referentially stable snapshot, so the parsed
// array is cached and only replaced when the serialised contents change.
const EMPTY_HISTORY: LessonRecord[] = [];
let cachedHistory: LessonRecord[] = EMPTY_HISTORY;
let cachedRaw = "";
let cachedStats: ProgressStats | null = null;

function snapshotHistory(): LessonRecord[] {
  if (typeof window === "undefined") return cachedHistory;
  let raw = "";
  try {
    raw = localStorage.getItem(HISTORY_KEY) ?? "";
  } catch {
    /* ignore */
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedHistory = readHistory();
    cachedStats = null;
  }
  return cachedHistory;
}

function snapshotStats(): ProgressStats {
  // Read through the cached path so the stats object is stable between writes.
  snapshotHistory();
  if (!cachedStats) cachedStats = getProgressStats();
  return cachedStats;
}

const EMPTY_STATS: ProgressStats = {
  totalLessons: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  firstTryCorrect: 0,
  subjectBreakdown: {},
  streak: { current: 0, longest: 0, lastDate: "" },
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
};

export function useLessonHistory() {
  const history = useSyncExternalStore(subscribe, snapshotHistory, () => EMPTY_HISTORY);
  const stats = useSyncExternalStore(subscribe, snapshotStats, () => EMPTY_STATS);

  const addRecord = useCallback((record: Omit<LessonRecord, "completedAt">) => {
    addLessonRecord(record);
  }, []);

  return { history, stats, addRecord };
}