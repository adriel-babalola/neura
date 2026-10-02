import type { SceneTone } from "@/lib/types";

/**
 * Voice routing for narration.
 *
 * All models here are reachable from the single OpenRouter key and all are
 * open-weight, so the same voices can be self-hosted or, at the smaller sizes,
 * run on device.
 *
 * Pure and environment-free so the routing table can be unit tested.
 */

export type VoiceMode = "auto" | "expressive" | "standard" | "budget";

export type VoiceTier = "expressive" | "emotive" | "budget";

export type VoiceProfile = {
  model: string;
  voice: string;
  /** Narration direction for models that accept style control. */
  style?: string;
  tier: VoiceTier;
};

/** Voice inventories, verified against the OpenRouter speech catalog. */
export const VOICE_INVENTORY = {
  "google/gemini-3.8-flash-tts": [
    "Zephyr",
    "Puck",
    "Charon",
    "Kore",
    "Fenrir",
    "Leda",
    "Orus",
    "Aoede",
    "Callirrhoe",
    "Autonoe",
    "Enceladus",
    "Iapetus",
    "Umbriel",
    "Algieba",
    "Despina",
    "Erinome",
    "Algenib",
    "Rasalgethi",
    "Laomedeia",
    "Achernar",
    "Alnilam",
    "Schedar",
    "Gacrux",
    "Pulcherrima",
    "Achird",
    "Zubenelgenubi",
    "Vindemiatrix",
    "Sadachbia",
    "Sadaltager",
    "Sulafat",
  ],
  "mistralai/voxtral-mini-tts-2603": [
    "en_paul_neutral",
    "en_paul_excited",
    "en_paul_cheerful",
    "en_paul_happy",
    "en_paul_confident",
    "gb_oliver_curious",
    "gb_oliver_cheerful",
    "gb_oliver_excited",
    "gb_jane_curious",
    "gb_jane_cheerful",
  ],
  "hexgrad/kokoro-82m": [
    "af_bella",
    "af_sarah",
    "af_sky",
    "af_nicole",
    "bf_emma",
    "bf_lily",
    "am_puck",
  ],
} as const satisfies Record<string, readonly string[]>;

/** The expressive default: Google Gemini Flash TTS, the creative/narration tier. */
export const EXPRESSIVE_MODEL = "google/gemini-3.8-flash-tts";
/** Emotion-tagged model. Kept reachable for self-hosting and experiments, but
 *  not used by default: see SINGLE_NARRATOR below. */
export const EMOTIVE_MODEL = "mistralai/voxtral-mini-tts-2603";
/** Hosted open-weight Kokoro. Roughly 26x cheaper than the expressive tier. */
export const BUDGET_MODEL = "hexgrad/kokoro-82m";

/**
 * The one voice the child hears, whatever the beat.
 *
 * Routing each tone to a different model was the reason the tutor sounded like
 * three different people: narration was Gemini "Puck", questions were Voxtral
 * "gb_oliver_curious", and praise was Voxtral "en_paul_excited". Switching
 * speakers mid-lesson made it impossible to tell the narrator was the same
 * character. All four tones therefore resolve to one model and one voice, and
 * only the delivery direction changes.
 *
 * Keeping a single voice also makes the API route's container pinning exact:
 * every chunk of an utterance is guaranteed to be the same format.
 */
export const NARRATOR_VOICE = "Puck";

/**
 * Scene tone to voice.
 *
 * Delivery direction is recorded per tone but deliberately not sent as a
 * provider option: the Gemini speech endpoint accepted `instructions` and
 * `style` without error, yet repeated identical requests returned different
 * audio lengths, so there was no way to confirm either field changed anything.
 * Unverifiable parameters are not worth the risk of a 400 on every request, so
 * emotion is carried by the model's own wording instead.
 */
const TONE_ROUTES: Record<SceneTone, VoiceProfile> = {
  narrate: {
    model: EXPRESSIVE_MODEL,
    voice: NARRATOR_VOICE,
    style: "warm and clear, speaking to one child, steady pace",
    tier: "expressive",
  },
  curious: {
    model: EXPRESSIVE_MODEL,
    voice: NARRATOR_VOICE,
    style: "playfully curious, as if asking something they genuinely want to know",
    tier: "expressive",
  },
  excited: {
    model: EXPRESSIVE_MODEL,
    voice: NARRATOR_VOICE,
    style: "delighted, like sharing a discovery",
    tier: "expressive",
  },
  encourage: {
    model: EXPRESSIVE_MODEL,
    voice: NARRATOR_VOICE,
    style: "gentle and encouraging, never patronising",
    tier: "expressive",
  },
};

/** Cheapest routing, still a single voice so the character holds. */
const BUDGET_ROUTES: Record<SceneTone, VoiceProfile> = {
  narrate: { model: BUDGET_MODEL, voice: "af_bella", tier: "budget" },
  curious: { model: BUDGET_MODEL, voice: "af_bella", tier: "budget" },
  excited: { model: BUDGET_MODEL, voice: "af_bella", tier: "budget" },
  encourage: { model: BUDGET_MODEL, voice: "af_bella", tier: "budget" },
};

/** Expressive for every beat. Identical to the default routes: one narrator. */
const STANDARD_ROUTES: Record<SceneTone, VoiceProfile> = TONE_ROUTES;

export const DEFAULT_TONE: SceneTone = "narrate";

export function isSceneTone(value: unknown): value is SceneTone {
  return value === "narrate" || value === "curious" || value === "excited" || value === "encourage";
}

export function parseVoiceMode(value: unknown): VoiceMode {
  return value === "expressive" || value === "standard" || value === "budget"
    ? value
    : "auto";
}

/** Resolve which voice should read a given scene. */
export function resolveVoice(
  tone: unknown,
  mode: VoiceMode = "auto"
): VoiceProfile {
  const t: SceneTone = isSceneTone(tone) ? tone : DEFAULT_TONE;
  if (mode === "budget") return BUDGET_ROUTES[t];
  if (mode === "standard" || mode === "expressive") return STANDARD_ROUTES[t];
  return TONE_ROUTES[t];
}

/** Ordered fallbacks for a profile, used when the primary model errors.
 *  The fallback is a different model, so it cannot be the same person; it is
 *  kept last-resort rather than preferred so that hearing two characters only
 *  happens when the primary voice is genuinely unavailable. */
export function voiceFallbacks(profile: VoiceProfile): VoiceProfile[] {
  const fallbacks: VoiceProfile[] = [];
  if (profile.tier === "expressive" || profile.tier === "emotive") {
    fallbacks.push({ model: BUDGET_MODEL, voice: "af_bella", tier: "budget" });
  } else {
    fallbacks.push(TONE_ROUTES.narrate);
  }
  return fallbacks;
}

/** True when the named voice actually exists in that model's inventory. */
export function voiceExists(model: string, voice: string): boolean {
  const list = VOICE_INVENTORY[model as keyof typeof VOICE_INVENTORY];
  return Array.isArray(list) && (list as readonly string[]).includes(voice);
}