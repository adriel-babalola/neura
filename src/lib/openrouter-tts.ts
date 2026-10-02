import "server-only";

import { latexToSpeech } from "@/lib/speech-text";
import {
  resolveVoice,
  voiceFallbacks,
  type VoiceMode,
  type VoiceProfile,
} from "@/lib/tts-voice";
import { parsePcmContentType, pcmToWav } from "@/lib/audio-format";

/**
 * Text-to-speech through OpenRouter's speech endpoint.
 *
 * One key covers both lesson generation and narration. Every model reachable
 * here is open-weight, which is what keeps a self-hosted or on-device narration
 * path viable later.
 *
 * Narration text is LaTeX-verbalised on the way in, so a scene that displays
 * `a^2 + b^2 = c^2` is spoken as "a squared plus b squared equals c squared"
 * regardless of which voice engine renders it.
 */

const SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";
const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_CHARS = 1000;

/** Rough per-character audio token estimate, used only for the cost log. */
function estimateCostChars(text: string): number {
  return text.length;
}

function apiKey(): string | null {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key || key.length <= 10 || /PASTE_/i.test(key)) return null;
  return key;
}

/**
 * In-memory audio cache.
 *
 * Narration text repeats heavily: a child replays scenes, and a board stroke
 * is narrated in more than one scene. Caching by content hash removes most
 * repeat synthesis cost on warm instances.
 */
type CacheEntry = { body: ArrayBuffer; contentType: string; at: number };
const CACHE = new Map<string, CacheEntry>();
const CACHE_MAX = 120;
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

function cacheKey(profile: VoiceProfile, text: string): string {
  let hash = 5381;
  const seed = `${profile.model}|${profile.voice}|${profile.style ?? ""}|${text}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  }
  return `${profile.model}:${profile.voice}:${(hash >>> 0).toString(36)}`;
}

function readCache(key: string): CacheEntry | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  // Refresh recency.
  CACHE.delete(key);
  CACHE.set(key, hit);
  return hit;
}

function writeCache(key: string, entry: CacheEntry): void {
  if (CACHE.size >= CACHE_MAX) {
    const oldest = CACHE.keys().next();
    if (!oldest.done) CACHE.delete(oldest.value);
  }
  CACHE.set(key, entry);
}

export function audioCacheStats(): { size: number } {
  return { size: CACHE.size };
}

/**
 * Models that speak raw PCM rather than MP3.
 *
 * Google TTS rejects `response_format: "mp3"` outright. Sending it anyway
 * failed every request, and because the failure was swallowed by the fallback
 * chain the expressive voice silently became the budget voice in production.
 */
const PCM_MODELS = new Set([
  "google/gemini-3.8-flash-tts",
  "google/gemini-3.8-flash-lite-tts",
  "google/gemini-3.1-flash-tts-preview",
]);

function responseFormatFor(model: string): "pcm" | "mp3" {
  return PCM_MODELS.has(model) ? "pcm" : "mp3";
}

/**
 * Request body for one speech call.
 *
 * No provider_options here on purpose. Gemini accepted a text_to_speech_config
 * blob, but repeated identical requests came back with different audio, so there
 * was no way to confirm the style field influenced anything. Shipping an
 * unverifiable parameter only added a 400 risk on the hot narration path.
 */
function buildBody(profile: VoiceProfile, spoken: string): Record<string, unknown> {
  return {
    model: profile.model,
    input: spoken,
    // Must be a plain string. An object here is rejected by request validation.
    voice: profile.voice,
    response_format: responseFormatFor(profile.model),
  };
}

async function synthWith(
  profile: VoiceProfile,
  spoken: string
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const key = apiKey();
  if (!key) throw new Error("NO_KEY: set OPENROUTER_API_KEY to enable narration");

  const configured = Number(process.env.NEURA_TTS_TIMEOUT_MS);
  const timeout = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  const referer = process.env.NEURA_SITE_URL?.trim();
  if (referer) headers["HTTP-Referer"] = referer;
  headers["X-Title"] = "Neura AI Tutor";

  const res = await fetch(SPEECH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(buildBody(profile, spoken)),
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`TTS_${res.status}: ${detail.slice(0, 200)}`);
  }

  const rawContentType = res.headers.get("content-type") || "audio/mpeg";
  const raw = await res.arrayBuffer();
  if (raw.byteLength === 0) throw new Error("TTS_EMPTY: provider returned no audio");

  // PCM has to be wrapped before a browser can play it.
  const pcm = parsePcmContentType(rawContentType);
  if (pcm) {
    return { body: pcmToWav(raw, pcm), contentType: "audio/wav" };
  }

  return { body: raw, contentType: rawContentType };
}

export type SynthesizeOptions = {
  tone?: string;
  mode?: VoiceMode;
  /**
   * Pin the voice instead of resolving it.
   *
   * Required when synthesising several chunks of one utterance: if any chunk
   * silently fell back to a different model, the chunks would be in different
   * container formats (Gemini returns PCM/WAV, the others MP3) and joining them
   * would produce unplayable audio.
   */
  profile?: VoiceProfile;
};

/**
 * Synthesize speech for narration text.
 *
 * Walks the routed voice and then its fallbacks, and never throws for a single
 * provider failure: the route reports failure so the client can fall back to
 * the browser voice rather than silently speaking markup.
 */
export async function synthesizeSpeech(
  text: string,
  options?: SynthesizeOptions
): Promise<{
  audio: ArrayBuffer;
  contentType: string;
  model: string;
  voice: string;
  cached: boolean;
}> {
  const spoken = latexToSpeech(text).slice(0, MAX_CHARS);
  if (!spoken) throw new Error("EMPTY_TEXT");

  const mode =
    options?.mode ?? (process.env.NEURA_TTS_MODE as VoiceMode | undefined) ?? "auto";
  // A pinned profile still gets its fallbacks, so a single unreachable chunk
  // fails the utterance loudly instead of splicing two models together.
  const primary = options?.profile ?? resolveVoice(options?.tone, mode);
  const chain = [primary, ...voiceFallbacks(primary)];

  const errors: string[] = [];

  for (const profile of chain) {
    const key = cacheKey(profile, spoken);
    const hit = readCache(key);
    if (hit) {
      return {
        audio: hit.body,
        contentType: hit.contentType,
        model: profile.model,
        voice: profile.voice,
        cached: true,
      };
    }

    try {
      const result = await synthWith(profile, spoken);
      writeCache(key, { ...result, at: Date.now() });
      if (process.env.NODE_ENV !== "production") {
        const chars = estimateCostChars(spoken);
        console.log(`[tts] ${profile.model}/${profile.voice} tier=${profile.tier} chars=${chars}`);
      }
      return {
        audio: result.body,
        contentType: result.contentType,
        model: profile.model,
        voice: profile.voice,
        cached: false,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${profile.model}/${profile.voice}: ${message}`);
      // A quiet fallback is how the expressive voice was lost in production:
      // the model errored, the request still succeeded, and nothing showed it.
      console.warn(
        `[tts] ${profile.model}/${profile.voice} failed, trying fallback: ${message.slice(0, 200)}`
      );
    }
  }

  throw new Error(`TTS_FAILED: ${errors.join(" | ")}`);
}

export { BUDGET_MODEL, resolveVoice } from "@/lib/tts-voice";
