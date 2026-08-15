"use client";

let enabled = true;
let unlocked = false;
let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isSpeechEnabled() {
  return enabled;
}

export function setSpeechEnabled(value: boolean) {
  enabled = value;
  if (!value) stopSpeaking();
}

export function unlockSpeech() {
  if (!unlocked && isSpeechSupported()) {
    unlocked = true;
    try {
      const synth = window.speechSynthesis;
      const prime = new SpeechSynthesisUtterance(" ");
      prime.volume = 0;
      synth.speak(prime);
    } catch {
      /* ignore */
    }
  }
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  const synth = window.speechSynthesis;
  const list = synth.getVoices();
  if (list.length) voices = list;
  return voices;
}

if (typeof window !== "undefined" && isSpeechSupported()) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
    listeners.forEach((l) => l());
  };
}

export function onVoicesChanged(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function hasVoices() {
  return loadVoices().length > 0;
}

export function speechStatus(): "ok" | "no-voices" | "unsupported" {
  if (!isSpeechSupported()) return "unsupported";
  return hasVoices() ? "ok" : "no-voices";
}

const PREFERRED_VOICE_NAMES = [
  "Google US English",
  "Samantha",
  "Karen",
  "Moira",
  "Aria",
  "Zira",
  "Jenny",
  "Microsoft Zira",
  "Microsoft Aria",
  "Microsoft Jenny",
];

function pickVoice(): SpeechSynthesisVoice | null {
  loadVoices();
  if (!voices.length) return null;
  const all = voices;
  const en = all.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = en.length ? en : all;
  for (const name of PREFERRED_VOICE_NAMES) {
    const match = pool.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (match) return match;
  }
  const local = pool.find((v) => v.localService);
  if (local) return local;
  return pool[0] ?? null;
}

export function speak(text: string, opts?: { interrupt?: boolean }) {
  if (!isSpeechSupported() || !enabled) return;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  utterance.pitch = 1.06;
  utterance.volume = 1;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;

  if (opts?.interrupt === false) {
    if (synth.speaking || synth.pending) return;
    synth.speak(utterance);
    return;
  }

  // Chrome/Edge drop an utterance spoken in the same tick as cancel();
  // defer a tick so the previous speech is fully cleared first.
  synth.cancel();
  setTimeout(() => synth.speak(utterance), 40);
}

export function speakAwait(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSupported() || !enabled) {
      resolve();
      return;
    }
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1.06;
    utterance.volume = 1;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    let settled = false;
    // Safety: never hang forever if the browser drops the utterance.
    // Formula: 120ms/char (average speaking rate ~140 wpm) with
    // minimum 6s (short phrases need time for TTS init) and max 90s cap.
    const estimatedMs = Math.min(90000, Math.max(6000, text.length * 120));
    const safety = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve();
      }
    }, estimatedMs);
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safety);
      resolve();
    };
    utterance.onend = done;
    utterance.onerror = done;

    synth.cancel();
    setTimeout(() => {
      if (settled) return;
      try {
        synth.speak(utterance);
      } catch {
        done();
      }
    }, 40);
  });
}

export function stopSpeaking() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
