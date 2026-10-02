import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/openrouter-tts";
import { concatAudio } from "@/lib/audio-format";
import { parseVoiceMode, resolveVoice } from "@/lib/tts-voice";
import { toSpeechText } from "@/lib/speech-text";

/**
 * Narration API route.
 *
 * Primary path is OpenRouter's speech endpoint, which means the same API key
 * used for lesson generation also produces the voice. Model and voice are
 * chosen from the scene tone so question and celebration beats are delivered
 * differently from narration.
 *
 * There is deliberately no third-party scrape here. The previous Google
 * Translate fallback was the source of the robotic voice, and the client
 * already has a browser speech fallback that needs no network at all.
 *
 * Input is LaTeX-verbalised server-side, so even if a caller sends raw markup
 * the narration stays comprehensible.
 */

const MAX_INPUT = 4000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let raw = "";
  let tone: string | undefined;
  let mode: string | undefined;

  try {
    const body = await request.json();
    if (typeof body?.text === "string") raw = body.text.slice(0, MAX_INPUT);
    if (typeof body?.tone === "string") tone = body.tone.slice(0, 20);
    if (typeof body?.mode === "string") mode = body.mode.slice(0, 20);
  } catch {
    return NextResponse.json({ error: "MALFORMED_BODY" }, { status: 400 });
  }

  if (!raw.trim()) {
    return NextResponse.json({ error: "MISSING_TEXT" }, { status: 400 });
  }

  const chunks = toSpeechText(raw, 900);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "EMPTY_SPEECH" }, { status: 400 });
  }

  const voiceMode = parseVoiceMode(mode);

  // Resolve the voice once for the whole utterance.
  //
  // Providers return different containers: Gemini TTS only speaks raw PCM (wrapped
  // here as WAV), the others return MP3. If one chunk times out and silently
  // falls back to a different model, joining WAV payloads with MP3 frames yields
  // a file that starts with a RIFF header and then plays garbage. Pinning the
  // profile keeps every chunk in one container, and a mismatch is then detected
  // and failed rather than served as noise.
  const profile = resolveVoice(tone, voiceMode);

  const audioParts: ArrayBuffer[] = [];
  let contentType = "";
  let model = "";
  let voice = "";

  try {
    for (const chunk of chunks) {
      const result = await synthesizeSpeech(chunk, { mode: voiceMode, profile });
      if (contentType && result.contentType !== contentType) {
        throw new Error(
          `TTS_MIXED_FORMATS: ${model} returned ${contentType} but a chunk returned ${result.contentType}`
        );
      }
      audioParts.push(result.audio);
      contentType = result.contentType;
      model = result.model;
      voice = result.voice;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[tts] synthesis failed:", message);
    return NextResponse.json(
      { error: "TTS_FAILED", detail: message.slice(0, 300) },
      { status: 502 }
    );
  }

  if (audioParts.length === 0) {
    return NextResponse.json({ error: "TTS_EMPTY" }, { status: 502 });
  }

  const combined = concatAudio(audioParts, contentType);

  return new NextResponse(combined, {
    headers: {
      "Content-Type": contentType,
      // Narration contains the child's name, so it must never reach a shared
      // cache. Deterministic per model/voice/text, but only the browser and the
      // server's own in-memory cache should reuse it. See readCache() in
      // openrouter-tts.ts for the actual reuse layer.
      "Cache-Control": "private, no-store",
      "X-Neura-Tts-Model": model,
      "X-Neura-Tts-Voice": voice,
    },
  });
}

