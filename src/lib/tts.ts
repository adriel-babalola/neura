"use client";

let current: { audio: HTMLAudioElement; url: string } | null = null;
const queue: string[] = [];
const playSet = new Set<string>();
let processing = false;
let consecutiveFailures = 0;
let pausedUntil = 0;
let quotaBlocked = false;

const MAX_FAILURES = 3;
const PAUSE_MS = 20_000;
const QUOTA_PAUSE_MS = 10 * 60_000;
const LOG = true;

function log(...args: unknown[]) {
  if (LOG) console.log("[neura:tts]", ...args);
}

export function isRemoteAvailable() {
  if (Date.now() >= pausedUntil && consecutiveFailures >= MAX_FAILURES) {
    consecutiveFailures = 0;
  }
  return Date.now() >= pausedUntil;
}

export function isQuotaBlocked() {
  if (quotaBlocked && Date.now() >= pausedUntil) {
    quotaBlocked = false;
  }
  return quotaBlocked;
}

export function isRemoteSpeaking() {
  return !!current && !current.audio.paused && !current.audio.ended;
}

export function stopRemote() {
  log("stopRemote", current ? "interrupting playback" : "nothing playing");
  if (current) {
    current.audio.pause();
    URL.revokeObjectURL(current.url);
    current = null;
  }
}

function enqueue(text: string, play: boolean) {
  if (!text.trim()) return;
  if (!isRemoteAvailable()) {
    log(`skip "${text.slice(0, 50)}" (voice cooling down, ${Math.ceil((pausedUntil - Date.now()) / 1000)}s)`);
    return;
  }
  if (!queue.includes(text)) queue.push(text);
  if (play) playSet.add(text);
  log("enqueue", `play=${play} queue=${queue.length} :: "${text.slice(0, 50)}"`);
  void pump();
}

async function pump() {
  if (processing) return;
  processing = true;
  try {
    while (queue.length > 0 && isRemoteAvailable()) {
      const text = queue.shift()!;
      const play = playSet.has(text);
      playSet.delete(text);
      try {
        await synthesize(text, play);
        consecutiveFailures = 0;
      } catch (err) {
        consecutiveFailures += 1;
        const msg = err instanceof Error ? err.message : String(err);
        const quota = /QUOTA|429/i.test(msg);
        log("FAIL", `"${text.slice(0, 50)}" (${msg}) — failure ${consecutiveFailures}/${MAX_FAILURES}`);
        if (quota) {
          quotaBlocked = true;
          pausedUntil = Date.now() + QUOTA_PAUSE_MS;
          log("QUOTA EXHAUSTED — pausing cloud voice for", QUOTA_PAUSE_MS / 60000, "min");
          break;
        }
        if (consecutiveFailures >= MAX_FAILURES) {
          pausedUntil = Date.now() + PAUSE_MS;
          log("pausing voice for", PAUSE_MS / 1000, "s after", consecutiveFailures, "consecutive failures");
          stopRemote();
        }
      }
    }
  } finally {
    processing = false;
  }
}

async function synthesize(text: string, play: boolean) {
  const started = Date.now();
  log("synthesize", `request "${text.slice(0, 50)}"`);
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const type = res.headers.get("content-type") || "";
  log("synthesize", `status=${res.status} in ${Date.now() - started}ms "${text.slice(0, 50)}"`);
  if (!res.ok) {
    const info = await res.json().catch(() => null);
    throw new Error(info?.error || `tts ${res.status}`);
  }
  if (type.includes("application/json")) {
    const info = await res.json().catch(() => null);
    throw new Error(info?.error || "tts failed");
  }
  const blob = await res.blob();
  if (play && isRemoteAvailable()) {
    const url = URL.createObjectURL(blob);
    stopRemote();
    const audio = new Audio(url);
    current = { audio, url };
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("audio playback failed"));
      audio.play().catch(reject);
    });
  }
}

export function speakRemote(text: string): Promise<void> {
  enqueue(text, true);
  return Promise.resolve();
}

export function prewarmRemote(texts: string[]): void {
  log("prewarm", `${texts.length} texts`);
  texts.forEach((t) => enqueue(t, false));
}
