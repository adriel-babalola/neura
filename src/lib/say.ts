"use client";

import {
  hasVoices,
  isSpeechEnabled,
  isSpeechSupported,
  speakAwait as speakLocalAwait,
  stopSpeaking as stopLocal,
} from "@/lib/speech";
import { latexToSpeech, toSpeechText } from "@/lib/speech-text";

/**
 * Narration pipeline.
 *
 * Order matters and was previously inverted. The browser voice is tried first
 * here, which is why the product sounded robotic on any device that had a
 * system voice installed. The cloud route now runs first, and the browser
 * voice is the offline fallback where it belongs.
 *
 * Text is LaTeX-verbalised before it leaves the client as well as on the
 * server, so a scene that displays `a^2 + b^2 = c^2` is spoken as words even
 * if the API route is bypassed.
 */

const LOG = process.env.NODE_ENV !== "production";

let audioElement: HTMLAudioElement | null = null;

/**
 * Playback is strictly serial.
 *
 * Previously every say() call started independently, and starting playback
 * called stopAudio() first. When a scene's narration was still playing and the
 * next scene's line or the question prompt arrived, the newcomer cut the
 * sentence off mid-word - which is what produced "one voice started, another
 * voice cut in, then everything stopped". The two requests also resolved to
 * different models, so it sounded like two different people arguing.
 *
 * Now work is queued and played one utterance at a time. stopSay() is the only
 * thing that interrupts, and it invalidates anything still in flight.
 */
type Job = {
  text: string;
  tone?: string;
  resolve: () => void;
};

const queue: Job[] = [];
let draining: Promise<void> | null = null;
/** Incremented by stopSay(); any work tagged with an older value is discarded. */
let epoch = 0;

function log(...args: unknown[]) {
  if (LOG) console.log("[neura:say]", ...args);
}

export function hasLocalVoice() {
  return isSpeechSupported() && hasVoices();
}

/** In-memory audio cache keyed by tone plus spoken text. */
const AUDIO_CACHE = new Map<string, string>();
const AUDIO_CACHE_MAX = 24;

function cacheKey(tone: string | undefined, text: string): string {
  return `${tone ?? "narrate"}:${text}`;
}

function readAudioCache(key: string): string | null {
  const hit = AUDIO_CACHE.get(key);
  if (!hit) return null;
  AUDIO_CACHE.delete(key);
  AUDIO_CACHE.set(key, hit);
  return hit;
}

function writeAudioCache(key: string, url: string): void {
  if (AUDIO_CACHE.size >= AUDIO_CACHE_MAX) {
    const oldest = AUDIO_CACHE.keys().next();
    if (!oldest.done) {
      const stale = AUDIO_CACHE.get(oldest.value);
      if (stale) URL.revokeObjectURL(stale);
      AUDIO_CACHE.delete(oldest.value);
    }
  }
  AUDIO_CACHE.set(key, url);
}

export function clearAudioCache() {
  for (const url of AUDIO_CACHE.values()) URL.revokeObjectURL(url);
  AUDIO_CACHE.clear();
}

function playAudioUrl(url: string, jobEpoch: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    // Nothing to interrupt: the drain loop guarantees we are the only thing
    // playing, so this never cuts another utterance off.
    if (jobEpoch !== epoch) {
      resolve(false);
      return;
    }
    const audio = new Audio(url);
    audioElement = audio;
    const settle = (ok: boolean) => {
      if (audioElement === audio) audioElement = null;
      resolve(ok);
    };
    audio.onended = () => settle(true);
    audio.onerror = () => settle(false);
    audio.play().catch(() => settle(false));
  });
}

function stopAudio() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement = null;
  }
}

/** Play one job's chunks through the cloud route. Returns true if audio played. */
async function speakViaRoute(text: string, tone: string | undefined, jobEpoch: number): Promise<boolean> {
  const chunks = toSpeechText(text, 900);
  if (chunks.length === 0) return false;

  let playedAny = false;
  for (const chunk of chunks) {
    // Stopped while this utterance was working: abandon it rather than speaking
    // a stale line after the child has already moved on.
    if (jobEpoch !== epoch) break;
    if (!isSpeechEnabled()) break;

    const key = cacheKey(tone, chunk);
    const cached = readAudioCache(key);
    if (cached) {
      if (await playAudioUrl(cached, jobEpoch)) playedAny = true;
      continue;
    }

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, tone }),
      });
      if (!res.ok) {
        log("tts route failed:", res.status);
        continue;
      }
      const blob = await res.blob();
      if (blob.size === 0) continue;
      const url = URL.createObjectURL(blob);
      writeAudioCache(key, url);
      if (await playAudioUrl(url, jobEpoch)) playedAny = true;
    } catch (err) {
      log("tts route error:", err instanceof Error ? err.message : err);
    }
  }
  return playedAny;
}

/**
 * Play one job: cloud voice first, browser voice only if the cloud route
 * produced nothing at all.
 */
async function speakJob(job: Job): Promise<void> {
  const jobEpoch = epoch;
  const spoken = latexToSpeech(job.text);
  if (!spoken.trim()) return;

  const played = await speakViaRoute(spoken, job.tone, jobEpoch);
  if (played || jobEpoch !== epoch) return;
  if (!isSpeechEnabled()) return;

  log("falling back to browser voice");
  await speakLocalAwait(spoken).catch(() => undefined);
}

/** Drain the queue in order. Only ever one loop alive at a time. */
async function drain(): Promise<void> {
  if (draining) return draining;
  draining = (async () => {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      const jobEpoch = epoch;
      try {
        await speakJob(job);
      } catch (err) {
        log("narration failed:", err instanceof Error ? err.message : err);
      }
      if (jobEpoch !== epoch) {
        // Interrupted. Drop whatever the caller had queued behind it.
        queue.length = 0;
      }
      job.resolve();
    }
  })();
  try {
    await draining;
  } finally {
    draining = null;
  }
}

/**
 * Queue narration.
 *
 * Resolves once this specific utterance has finished, which is what lets the
 * lesson player hold a scene until its narration is done.
 */
export function say(text: string, tone?: string): Promise<void> {
  const spoken = latexToSpeech(text);
  if (!spoken.trim()) return Promise.resolve();

  if (!isSpeechEnabled()) {
    log("skip (sound off)", `"${spoken.slice(0, 50)}"`);
    return Promise.resolve();
  }

  log("queue", `tone=${tone ?? "narrate"}`, `"${spoken.slice(0, 50)}"`);

  return new Promise<void>((resolve) => {
    queue.push({ text: spoken, tone, resolve });
    void drain();
  });
}

/**
 * Interrupt everything: clear the queue, bump the epoch so in-flight fetches
 * and playback are ignored, and silence both voices.
 */
export function stopSay() {
  epoch++;
  queue.length = 0;
  stopLocal();
  stopAudio();
}

/**
 * Warm the audio cache for upcoming narration.
 * Requests are made one at a time so a lesson load cannot open a burst of
 * connections on a metered link.
 */
export async function prewarm(
  items: Array<{ text: string; tone?: string }>
): Promise<void> {
  if (!isSpeechEnabled() || items.length === 0) return;
  const targets = items.slice(0, 4);
  for (const item of targets) {
    const spoken = latexToSpeech(item.text);
    if (!spoken.trim()) continue;
    for (const chunk of toSpeechText(spoken, 900)) {
      const key = cacheKey(item.tone, chunk);
      if (AUDIO_CACHE.has(key)) continue;
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunk, tone: item.tone }),
        });
        if (!res.ok) continue;
        const blob = await res.blob();
        if (blob.size === 0) continue;
        writeAudioCache(key, URL.createObjectURL(blob));
      } catch {
        // Prewarming is best effort.
      }
    }
  }
}