"use client";

import {
  hasVoices,
  isSpeechEnabled,
  isSpeechSupported,
  speak as speakLocal,
  stopSpeaking as stopLocal,
} from "@/lib/speech";
import { isRemoteAvailable, prewarmRemote, speakRemote, stopRemote } from "@/lib/tts";

const LOG = true;

function log(...args: unknown[]) {
  if (LOG) console.log("[neura:say]", ...args);
}

export function hasLocalVoice() {
  return isSpeechSupported() && hasVoices();
}

export function say(text: string) {
  if (!text.trim()) return;
  if (!isSpeechEnabled()) {
    log("skip (sound off)", `"${text.slice(0, 50)}"`);
    return;
  }
  if (hasLocalVoice()) {
    log("local voice", `"${text.slice(0, 50)}"`);
    speakLocal(text);
  } else if (isRemoteAvailable()) {
    log("remote voice", `"${text.slice(0, 50)}"`);
    speakRemote(text);
  } else {
    log("skip (remote unavailable)", `"${text.slice(0, 50)}"`);
  }
}

export function prewarm(texts: string[]) {
  if (hasLocalVoice()) {
    log("prewarm skipped (local voice)");
    return;
  }
  if (!isRemoteAvailable()) {
    log("prewarm skipped (remote unavailable)");
    return;
  }
  prewarmRemote(texts);
}

export function stopSay() {
  stopLocal();
  stopRemote();
}
