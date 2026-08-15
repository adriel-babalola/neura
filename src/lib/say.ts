"use client";

import {
  hasVoices,
  isSpeechEnabled,
  isSpeechSupported,
  speak as speakLocal,
  stopSpeaking as stopLocal,
} from "@/lib/speech";

/**
 * Voice system with two strategies (NO API key needed for either):
 *
 * 1. Browser speechSynthesis (if voices are available)
 * 2. Google Translate TTS fallback (free, no auth, just audio URLs)
 *
 * Works on Brave/Ubuntu/Linux where speechSynthesis has no voices.
 */

const LOG = true;
let audioElement: HTMLAudioElement | null = null;

function log(...args: unknown[]) {
  if (LOG) console.log("[neura:say]", ...args);
}

export function hasLocalVoice() {
  return isSpeechSupported() && hasVoices();
}

/**
 * Split text into chunks of max ~200 chars (Google TTS limit per request).
 * Splits on sentence boundaries.
 */
function chunkText(text: string, maxLen = 200): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Find last sentence boundary within maxLen
    let splitAt = remaining.lastIndexOf(". ", maxLen);
    if (splitAt === -1 || splitAt < 50) splitAt = remaining.lastIndexOf(", ", maxLen);
    if (splitAt === -1 || splitAt < 50) splitAt = remaining.lastIndexOf(" ", maxLen);
    if (splitAt === -1 || splitAt < 50) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt + 1).trim());
    remaining = remaining.slice(splitAt + 1).trim();
  }
  return chunks.filter((c) => c.length > 0);
}

/**
 * Play text using Google Translate's free TTS endpoint.
 * No API key, no server, just a URL that returns MP3.
 */
async function speakWithGoogleTTS(text: string): Promise<void> {
  const chunks = chunkText(text, 200);
  for (const chunk of chunks) {
    if (!isSpeechEnabled()) break;
    const encoded = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encoded}`;
    await playAudioUrl(url);
  }
}

function playAudioUrl(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    stopAudio();
    const audio = new Audio(url);
    audioElement = audio;
    audio.onended = () => {
      audioElement = null;
      resolve();
    };
    audio.onerror = () => {
      audioElement = null;
      reject(new Error("audio playback failed"));
    };
    audio.play().catch((err) => {
      audioElement = null;
      reject(err);
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

export function say(text: string) {
  if (!text.trim()) return;
  if (!isSpeechEnabled()) {
    log("skip (sound off)", `"${text.slice(0, 50)}"`);
    return;
  }

  // Strategy 1: Browser speechSynthesis (if voices available)
  if (hasLocalVoice()) {
    log("local voice", `"${text.slice(0, 50)}"`);
    speakLocal(text);
    return;
  }

  // Strategy 2: Google Translate TTS (free, no key, works everywhere)
  log("google tts", `"${text.slice(0, 50)}"`);
  speakWithGoogleTTS(text).catch((err) => {
    log("google tts failed:", err instanceof Error ? err.message : err);
  });
}

export function prewarm(_texts: string[]) {
  // No prewarming needed
  log("prewarm skipped");
}

export function stopSay() {
  stopLocal();
  stopAudio();
}
