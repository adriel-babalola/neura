import type { LessonRequest } from "@/lib/types";

/**
 * Pure helpers for lesson generation: target resolution and response parsing.
 *
 * Kept free of `server-only` and of any network access so the failure modes
 * that matter most (a malformed model response, a missing key, a misconfigured
 * chain) can be unit tested directly.
 */

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/**
 * OpenRouter model chain, ordered by schema reliability then price.
 * All are open-weight (Apache 2.0 or OpenMDW) so the same weights can be
 * self-hosted later.
 */
export const OPENROUTER_CHAIN = [
  "google/gemma-4-31b-it",
  "google/gemma-4-26b-a4b-it",
  "nvidia/nemotron-3.5-lightning",
  "qwen/qwen3.8-27b",
];

/** Free variants. Capped at 50 requests a day, so opt-in only. */
export const OPENROUTER_FREE_CHAIN = [
  "google/gemma-4-31b-it:free",
  "qwen/qwen3.8-27b:free",
];

export type ModelTarget = {
  name: string;
  url: string;
  model: string;
  apiKey: string;
  /** Some OpenAI-compatible servers reject the json_object hint outright. */
  jsonHint: boolean;
  isOpenRouter: boolean;
};

/** Reject placeholder and truncated key values. */
export function usableKey(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 10) return null;
  if (/PASTE_/i.test(trimmed)) return null;
  if (/^your[-_]/i.test(trimmed)) return null;
  return trimmed;
}

function openRouterTargets(apiKey: string, freeAllowed: boolean, override?: string): ModelTarget[] {
  const chain = override ? [override, ...OPENROUTER_CHAIN] : OPENROUTER_CHAIN;
  const targets = chain.map((model) => ({
    name: "OpenRouter",
    url: OPENROUTER_URL,
    model,
    apiKey,
    jsonHint: true,
    isOpenRouter: true,
  }));
  if (freeAllowed) {
    for (const model of OPENROUTER_FREE_CHAIN) {
      targets.push({
        name: "OpenRouter-free",
        url: OPENROUTER_URL,
        model,
        apiKey,
        jsonHint: true,
        isOpenRouter: true,
      });
    }
  }
  return targets;
}

/**
 * Build the ordered target chain.
 *
 * Priority is self-hosted endpoint, then OpenRouter on one key, then optional
 * extra providers. Setting NEURA_LLM_BASE_URL is therefore enough to move the
 * whole system onto infrastructure we control.
 */
export function getModelChain(env: NodeJS.ProcessEnv = process.env): ModelTarget[] {
  const targets: ModelTarget[] = [];

  const selfBase = env.NEURA_LLM_BASE_URL?.trim();
  const selfModel = env.NEURA_LLM_MODEL?.trim();
  const selfKey = usableKey(env.NEURA_LLM_API_KEY) ?? usableKey(env.OPENROUTER_API_KEY);
  if (selfBase && selfModel && selfKey) {
    targets.push({
      name: "Self-hosted",
      url: `${selfBase.replace(/\/+$/, "")}/chat/completions`,
      model: selfModel,
      apiKey: selfKey,
      jsonHint: env.NEURA_LLM_JSON_HINT !== "false",
      isOpenRouter: false,
    });
  }

  const orKey = usableKey(env.OPENROUTER_API_KEY);
  if (orKey) {
    targets.push(
      ...openRouterTargets(
        orKey,
        env.NEURA_ALLOW_FREE_MODELS === "true",
        env.OPENROUTER_MODEL?.trim() || undefined
      )
    );
  }

  const groqKey = usableKey(env.GROQ_API_KEY);
  if (groqKey) {
    targets.push({
      name: "Groq",
      url: GROQ_URL,
      model: env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      apiKey: groqKey,
      jsonHint: true,
      isOpenRouter: false,
    });
  }

  const geminiKey = usableKey(env.GEMINI_API_KEY);
  if (geminiKey) {
    targets.push({
      name: "Gemini",
      url: GEMINI_URL,
      model: env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
      apiKey: geminiKey,
      jsonHint: true,
      isOpenRouter: false,
    });
  }

  return targets;
}

/** Extract the assistant message from the response shapes providers return. */
export function extractContent(data: unknown): string {
  const root = data as {
    choices?: Array<{ message?: { content?: unknown } }>;
    content?: unknown;
  };

  const message = root?.choices?.[0]?.message?.content;
  if (typeof message === "string" && message.trim()) return message;

  if (Array.isArray(message)) {
    const joined = message
      .map((part) =>
        part && typeof part === "object" && "text" in part ? String(part.text) : ""
      )
      .join("");
    if (joined.trim()) return joined;
  }

  if (typeof root?.content === "string" && root.content.trim()) return root.content;
  return "";
}

/**
 * Parse JSON from a model response, tolerating code fences, leading prose and
 * trailing commentary. Falls back to extracting the first balanced object.
 */
export function parseJsonLoose(raw: string): unknown {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    if (start === -1) throw new Error("NOT_JSON: no object found in model output");

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return JSON.parse(trimmed.slice(start, i + 1));
      }
    }
    throw new Error("NOT_JSON: unbalanced object in model output");
  }
}

export const STORY_MODE_PROMPT = `You are Neura, a world-class Socratic AI tutor for children aged 8-12. You create immersive story-based lessons that weave academic concepts into vivid narrative adventures. Never give direct answers. Guide children to discover understanding themselves.

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
11. The narrative is displayed on screen and MAY contain LaTeX inside dollar signs. Keep it.
12. Every scene MUST include a "speech" field: the same message rewritten as plain spoken English that a text-to-speech engine reads aloud. speech must contain no LaTeX, no dollar signs, no carets and no backslashes. Write mathematics as words. For example, for the LaTeX "a^2 + b^2 = c^2" the speech is "a squared plus b squared equals c squared". For "\\frac{1}{2}" the speech is "one over two".
13. Every scene MUST include a "tone" field, one of: "narrate", "curious", "excited", "encourage". Use "curious" when the scene poses a question, "excited" at a discovery, "encourage" after the child succeeds.
14. Every scene MUST include a "board" array of 1 to 3 drawable operations, in the order they should appear. Each entry is exactly one of:
   - { "kind": "equation", "tex": "LaTeX for KaTeX", "emphasis": "none" or "highlight" or "box" }
   - { "kind": "diagram", "diagram": "right-triangle" or "rectangle" or "circle" or "number-line" or "grid", "labels": { "short key": "short label" } }
   - { "kind": "callout", "text": "short hint text", "tone": "hint" or "warning" or "success" }
   Use at least one diagram in every lesson that has a shape to draw. Do not use a diagram when there is nothing to draw.

OUTPUT: Valid JSON only. No markdown fences. No commentary outside the JSON.
Fields: id, mode ("story"), title, subject, focus, childName, intro, reflection, scenes (5-7), questions (4-5).
Each scene: { "index": (0-based integer), "narrative": (string, may contain LaTeX), "speech": (string, plain English, no LaTeX), "tone": (string), "board": (array of board operations), "question": (null or Question object) }
Each question: { "id": (string), "sceneIndex": (integer matching its scene), "prompt": (string), "hint": (string), "deeperHint": (string), "answer": (string), "accept": (array of strings) }

The questions array at the top level must contain every question also referenced in scenes. A scene with a question means the story pauses there for the child to answer.`;

export function buildUserPrompt(req: LessonRequest): string {
  const c = req.child;
  let prompt = `Create a story-based lesson for ${c.name}, age ${c.age}, who loves "${c.interest}".
Learning style: ${c.learningStyle}. Frustration: ${c.frustration || "not specified"}.
Subject: ${req.subject}. Struggled with: ${req.struggle}. Context: ${req.context || "none"}.
Mode: STORY (narrative adventure with embedded questions).`;
  if (req.difficulty) {
    prompt += `\nDifficulty level: ${req.difficulty}. Adjust complexity accordingly.`;
  }
  prompt += `\nGenerate 5-7 scenes and 4-5 questions embedded naturally in the story. Every scene needs speech, tone and board. JSON only.`;
  return prompt;
}

/** True when an error is worth retrying rather than moving to the next target. */
export function isRetryable(message: string): boolean {
  return (
    /\b(429|5\d{2})\b/.test(message) ||
    /timeout|timed out|abort|econnreset|etimedout|enotfound|enetunreach|eai_again|fetch failed|socket hang up|network/i.test(
      message
    )
  );
}

/** True when the server rejected the json_object hint rather than the request. */
export function isSchemaRejection(message: string): boolean {
  return /\b400\b/.test(message) && /response_format|json_object|json mode/i.test(message);
}