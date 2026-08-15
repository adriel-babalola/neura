/**
 * Groq TTS — OpenAI-compatible REST API for text-to-speech.
 *
 * Free tier: ~30 requests/min, no hard quota blocks.
 * Works perfectly in Vercel serverless (simple POST, no WebSocket).
 *
 * Docs: https://console.groq.com/docs/text-to-speech
 */

import "server-only";

const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const MODEL = "playback-tts-hd";

// Groq voices optimized for clarity and warmth
export const VOICES = {
  friendly: "Arista-PlayAI",   // Warm, clear female voice
  male: "Fritz-PlayAI",       // Friendly male voice
  narrator: "Maple-PlayAI",   // Great for storytelling
  energetic: "Atlas-PlayAI",  // Upbeat, engaging
} as const;

export type VoiceName = (typeof VOICES)[keyof typeof VOICES];

function getApiKey(): string | null {
  const key = process.env.GROQ_API_KEY;
  if (!key || key.includes("PASTE_") || key.length < 10) return null;
  return key;
}

/**
 * Synthesize text to audio using Groq's TTS REST API.
 * Returns audio as a Buffer (WAV format by default).
 */
export async function synthesize(
  text: string,
  options?: {
    voice?: string;
    speed?: number;
    responseFormat?: "wav" | "mp3" | "opus" | "flac" | "aac";
  }
): Promise<{ audio: Buffer; contentType: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("NO_KEY: Set GROQ_API_KEY environment variable");
  }

  const voice = options?.voice ?? VOICES.friendly;
  const speed = options?.speed ?? 0.95; // Slightly slower for kids
  const responseFormat = options?.responseFormat ?? "mp3";

  const res = await fetch(GROQ_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: text,
      voice,
      speed,
      response_format: responseFormat,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new Error(`RATE_LIMITED: ${detail.slice(0, 200)}`);
    }
    throw new Error(`GROQ_TTS_${res.status}: ${detail.slice(0, 200)}`);
  }

  const contentType = res.headers.get("content-type") || `audio/${responseFormat}`;
  const arrayBuffer = await res.arrayBuffer();
  const audio = Buffer.from(arrayBuffer);

  return { audio, contentType };
}
