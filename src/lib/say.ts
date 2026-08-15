"use client";

import {
  hasVoices,
  isSpeechEnabled,
  isSpeechSupported,
  speakAwait as speakLocalAwait,
  stopSpeaking as stopLocal,
} from "@/lib/speech";

/**
 * Voice system — NO external API key needed.
 *
 * Strategy 1: Browser speechSynthesis (if system has voices)
 * Strategy 2: Our /api/tts route which proxies free TTS (no CORS issues)
 */

const LOG = true;
let audioElement: HTMLAudioElement | null = null;
let speaking = false;

function log(...args: unknown[]) {
  if (LOG) console.log("[neura:say]", ...args);
}

export function hasLocalVoice() {
  return isSpeechSupported() && hasVoices();
}

/**
 * Split text into chunks of max ~190 chars for the TTS API.
 * Splits on sentence boundaries.
 */
function chunkText(text: string, maxLen = 190): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf(". ", maxLen);
    if (splitAt === -1 || splitAt < 40) splitAt = remaining.lastIndexOf(", ", maxLen);
    if (splitAt === -1 || splitAt < 40) splitAt = remaining.lastIndexOf(" ", maxLen);
    if (splitAt === -1 || splitAt < 40) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt + 1).trim());
    remaining = remaining.slice(splitAt + 1).trim();
  }
  return chunks.filter((c) => c.length > 0);
}

/**
 * Play text using our /api/tts proxy route (avoids CORS).
 */
async function speakViaProxy(text: string): Promise<void> {
  const chunks = chunkText(text, 190);
  for (const chunk of chunks) {
    if (!isSpeechEnabled() || !speaking) break;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk }),
      });
      if (!res.ok) {
        log("proxy tts failed:", res.status);
        continue;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      await playAudioUrl(url);
      URL.revokeObjectURL(url);
    } catch (err) {
      log("proxy tts error:", err instanceof Error ? err.message : err);
    }
  }
}

function playAudioUrl(url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    stopAudio();
    const audio = new Audio(url);
    audioElement = audio;
    audio.onended = () => {
      audioElement = null;
      resolve();
    };
    audio.onerror = () => {
      audioElement = null;
      resolve(); // Don't reject — just move on silently
    };
    audio.play().catch(() => {
      audioElement = null;
      resolve(); // Don't reject — just move on silently
    });
  });
}

function stopAudio() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement = null;
  }
}

export function say(text: string): Promise<void> {
  if (!text.trim()) return Promise.resolve();
  if (!isSpeechEnabled()) {
    log("skip (sound off)", `"${text.slice(0, 50)}"`);
    return Promise.resolve();
  }

  speaking = true;

  // Strategy 1: Browser speechSynthesis (if voices available)
  if (hasLocalVoice()) {
    log("local voice", `"${text.slice(0, 50)}"`);
    return speakLocalAwait(text);
  }

  // Strategy 2: Our proxy TTS route (free, no CORS, no key)
  log("proxy tts", `"${text.slice(0, 50)}"`);
  return speakViaProxy(text).catch((err) => {
    log("proxy tts failed:", err instanceof Error ? err.message : err);
  });
}

export function prewarm(_texts: string[]) {
  log("prewarm skipped", `${_texts.length} texts`);
}

export function stopSay() {
  speaking = false;
  stopLocal();
  stopAudio();
}
