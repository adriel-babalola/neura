/**
 * Groq TTS — Orpheus model via OpenAI-compatible REST API.
 *
 * Free tier: ~30 requests/min. No hard quota blocks.
 * Works perfectly in Vercel serverless (simple POST, no WebSocket).
 *
 * Model: canopylabs/orpheus-v1-english
 * Voices: tara, leah, jess, leo, dan, mia, zac, zoe
 * Docs: https://console.groq.com/docs/text-to-speech
 */

import "server-only";

const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const MODEL = "canopylabs/orpheus-v1-english";

// Voices suitable for children's educational content
export const VOICES = {
  friendly: "hannah", // Warm female, good for teaching
  narrator: "diana",  // Clear female narrator
  male: "daniel",     // Friendly male voice
  energetic: "autumn", // Upbeat female
} as const;

export type VoiceName = (typeof VOICES)[keyof typeof VOICES];

function getApiKey(): string | null {
  const key = process.env.GROQ_API_KEY;
  if (!key || key.includes("PASTE_") || key.length < 10) return null;
  return key;
}

/**
 * Synthesize text to audio using Groq's Orpheus TTS REST API.
 * Returns audio as a Buffer.
 */
export async function synthesize(
  text: string,
  options?: {
    voice?: string;
    responseFormat?: "wav" | "mp3" | "opus" | "flac" | "aac";
  }
): Promise<{ audio: Buffer; contentType: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("NO_KEY: Set GROQ_API_KEY environment variable");
  }

  const voice = options?.voice ?? VOICES.friendly;
  const responseFormat = options?.responseFormat ?? "wav";

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
      response_format: responseFormat,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new Error(`RATE_LIMITED: ${detail.slice(0, 200)}`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`AUTH_FAILED: Check your GROQ_API_KEY`);
    }
    throw new Error(`GROQ_TTS_${res.status}: ${detail.slice(0, 200)}`);
  }

  const contentType = res.headers.get("content-type") || `audio/${responseFormat}`;
  const arrayBuffer = await res.arrayBuffer();
  const audio = Buffer.from(arrayBuffer);

  return { audio, contentType };
}
