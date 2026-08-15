import "server-only";

import type { Lesson, LessonMode, LessonRequest } from "@/lib/types";

/**
 * Lesson generation using OpenRouter (free models, no credit card).
 *
 * Uses the free router which auto-selects from available free models.
 * Get a key at https://openrouter.ai/keys (no billing needed for free models).
 *
 * Fallback: If OPENROUTER_API_KEY is not set, uses GROQ_API_KEY with Groq.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Free model on OpenRouter — use the free router for best availability
const OPENROUTER_MODEL = "openrouter/auto";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYS_PROMPT = `You are Neura, a world-class Socratic AI tutor for children aged 8-12. Turn abstract concepts into vivid adventures. Never give direct answers. Guide children to discover understanding themselves.

RULES:
1. Start with a concrete real-world scenario the child can picture.
2. Break every step into its own scene. Never skip steps.
3. Use "math" lines for ALL formulas/equations (valid LaTeX). Never put math in text lines.
4. Include one "common mistake" scene showing what goes wrong and why.
5. End with a generalization pattern.
6. Use color hints: "text-chalk-y" (yellow=key terms), "text-chalk-p" (pink=warnings), "text-chalk-b" (blue=encouragement).
7. Questions should feel like natural pauses, not tests. Include 4-6 accept variations.
8. Keep text lines SHORT (under 80 chars). Use the child's interest in examples.
9. Do not use em-dashes or en-dashes. Use commas or periods.

BOARD MODE: Every scene MUST have at least one "math" line with valid LaTeX.
STORY MODE: All lines are "text". Weave concepts into narrative.

OUTPUT: Valid JSON only. No markdown fences.
Fields: id, mode, title, subject, focus, childName, intro, scenes (5-8), questions (4-5), reflection.
Each scene has "lines" array: {kind:"text",text:"...",color:"..."} or {kind:"math",latex:"..."} or {kind:"divider"}
Each question: {id, sceneIndex (0-based int), prompt, hint, deeperHint, answer, accept (array)}`;

function buildUserPrompt(req: LessonRequest) {
  const c = req.child;
  return `Lesson for ${c.name}, age ${c.age}, loves "${c.interest}".
Learning style: ${c.learningStyle}. Frustration: ${c.frustration || "not specified"}.
Subject: ${req.subject}. Struggled with: ${req.struggle}. Context: ${req.context || "none"}.
Mode: ${req.mode === "story" ? "STORY (all text)" : "BOARD (text + LaTeX math every scene)"}.
Generate 5-8 scenes, 4-5 questions. JSON only.`;
}

export async function generateLesson(req: LessonRequest): Promise<Lesson> {
  // Try OpenRouter first, then Groq as fallback
  const providers = getProviders();
  if (providers.length === 0) {
    throw new Error("NO_KEY");
  }

  let lastError = "";
  for (const config of providers) {
    try {
      const result = await callProvider(config, req);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[generate-lesson] ${config.url} failed: ${lastError}`);
      // Try next provider
    }
  }

  throw new Error(lastError || "ALL_PROVIDERS_FAILED");
}

function getProviders(): { url: string; model: string; apiKey: string }[] {
  const providers: { url: string; model: string; apiKey: string }[] = [];

  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey && orKey.length > 10 && !orKey.includes("PASTE_")) {
    providers.push({ url: OPENROUTER_URL, model: OPENROUTER_MODEL, apiKey: orKey });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.length > 10 && !groqKey.includes("PASTE_")) {
    providers.push({ url: GROQ_URL, model: GROQ_MODEL, apiKey: groqKey });
  }

  return providers;
}

async function callProvider(
  config: { url: string; model: string; apiKey: string },
  req: LessonRequest
): Promise<Lesson> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (config.url === OPENROUTER_URL) {
    headers["HTTP-Referer"] = "https://neuraai-liard.vercel.app";
    headers["X-Title"] = "Neura AI Tutor";
  }

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: "system", content: SYS_PROMPT },
      { role: "user", content: buildUserPrompt(req) },
    ],
    temperature: 0.85,
    max_tokens: 8192,
  };

  if (config.url === GROQ_URL) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("EMPTY_RESPONSE");

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  const parsed = JSON.parse(cleaned) as Lesson;
  const scenesOk =
    parsed.scenes?.length > 0 &&
    parsed.scenes.every(
      (s) =>
        Array.isArray(s.lines) &&
        s.lines.length > 0 &&
        s.lines.every(
          (l) =>
            (l.kind === "text" && l.text?.trim()) ||
            (l.kind === "math" && l.latex?.trim()) ||
            l.kind === "divider"
        )
    );
  if (!parsed.questions?.length || !scenesOk) {
    throw new Error("MALFORMED");
  }
  return parsed;
}
