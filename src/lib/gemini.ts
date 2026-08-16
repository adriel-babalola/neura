import "server-only";

import type { Lesson, LessonRequest } from "@/lib/types";

/**
 * Lesson generation using OpenRouter (free models, no credit card).
 *
 * Uses a specific free model for reliable free-tier usage.
 * Get a key at https://openrouter.ai/keys (no billing needed for free models).
 *
 * Fallback chain: OpenRouter -> Groq -> Gemini
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Specific free model on OpenRouter for reliable free-tier usage
const OPENROUTER_MODEL = "deepseek/deepseek-chat-v3-0324:free";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-2.0-flash";

const STORY_MODE_PROMPT = `You are Neura, a world-class Socratic AI tutor for children aged 8-12. You create immersive story-based lessons that weave academic concepts into vivid narrative adventures. Never give direct answers. Guide children to discover understanding themselves.

RULES:
1. Start with a concrete real-world scenario the child can picture, connected to their interest.
2. Each scene is a narrative paragraph (2-4 sentences) that advances the story AND teaches a concept.
3. Embed questions naturally as story pauses where the character needs help.
4. Include one scene showing a common mistake as a plot obstacle.
5. End with a reflection that ties the story conclusion to the lesson learned.
6. Questions should feel like the character asking for help, not a test.
7. Include 4-6 accept variations for each question answer.
8. Use the child's interest to shape characters and setting.
9. Do not use em-dashes or en-dashes. Use commas or periods instead.
10. Keep narratives vivid but concise. Each scene narrative should be 2-4 sentences.

OUTPUT: Valid JSON only. No markdown fences.
Fields: id, mode ("story"), title, subject, focus, childName, intro, reflection, scenes (5-7), questions (4-5).
Each scene: {index (0-based int), narrative (string), question (null or Question object)}
Each question: {id, sceneIndex (matching scene index), prompt, hint, deeperHint, answer, accept (array of strings)}

The questions array at the top level should contain ALL questions also referenced in scenes.
A scene with a question means the story pauses there for the child to answer.`;

function buildUserPrompt(req: LessonRequest) {
  const c = req.child;
  let prompt = `Create a story-based lesson for ${c.name}, age ${c.age}, who loves "${c.interest}".
Learning style: ${c.learningStyle}. Frustration: ${c.frustration || "not specified"}.
Subject: ${req.subject}. Struggled with: ${req.struggle}. Context: ${req.context || "none"}.
Mode: STORY (narrative adventure with embedded questions).`;
  if (req.difficulty) {
    prompt += `\nDifficulty level: ${req.difficulty}. Adjust complexity accordingly.`;
  }
  prompt += `\nGenerate 5-7 scenes, 4-5 questions embedded naturally in the story. JSON only.`;
  return prompt;
}

export async function generateLesson(req: LessonRequest): Promise<Lesson> {
  // Try OpenRouter first (with retry), then Groq, then Gemini as fallbacks
  const providers = getProviders();
  if (providers.length === 0) {
    throw new Error("NO_KEY");
  }

  const attempted: string[] = [];
  let lastError = "";
  for (const config of providers) {
    attempted.push(`${config.name}(${config.model})`);
    try {
      const result = await callProvider(config, req);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[generate-lesson] ${config.name} failed: ${lastError}`);

      // Retry once for OpenRouter on 5xx or 429 errors
      if (config.url === OPENROUTER_URL && /^(5\d{2}|429):/.test(lastError)) {
        console.log(`[generate-lesson] Retrying ${config.name} after 2s delay...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          const result = await callProvider(config, req);
          return result;
        } catch (retryErr) {
          lastError = retryErr instanceof Error ? retryErr.message : String(retryErr);
          console.error(`[generate-lesson] ${config.name} retry failed: ${lastError}`);
        }
      }
      // Try next provider
    }
  }

  throw new Error(
    `ALL_PROVIDERS_FAILED: Tried ${attempted.join(", ")}. Last error: ${lastError}`
  );
}

function getProviders(): { name: string; url: string; model: string; apiKey: string }[] {
  const providers: { name: string; url: string; model: string; apiKey: string }[] = [];

  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey && orKey.length > 10 && !orKey.includes("PASTE_")) {
    providers.push({ name: "OpenRouter", url: OPENROUTER_URL, model: OPENROUTER_MODEL, apiKey: orKey });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.length > 10 && !groqKey.includes("PASTE_")) {
    providers.push({ name: "Groq", url: GROQ_URL, model: GROQ_MODEL, apiKey: groqKey });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.length > 10 && !geminiKey.includes("PASTE_")) {
    providers.push({ name: "Gemini", url: GEMINI_URL, model: GEMINI_MODEL, apiKey: geminiKey });
  }

  return providers;
}

async function callProvider(
  config: { name: string; url: string; model: string; apiKey: string },
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
      { role: "system", content: STORY_MODE_PROMPT },
      { role: "user", content: buildUserPrompt(req) },
    ],
    temperature: 0.85,
    max_tokens: 2500,
  };

  // Enable structured JSON output for all providers
  if (config.url === GROQ_URL || config.url === OPENROUTER_URL || config.url === GEMINI_URL) {
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
      (s) => typeof s.narrative === "string" && s.narrative.trim().length > 0
    );
  if (!parsed.questions?.length || !scenesOk) {
    throw new Error("MALFORMED");
  }
  return parsed;
}
