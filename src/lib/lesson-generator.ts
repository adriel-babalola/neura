import "server-only";

import type { Lesson, LessonRequest } from "@/lib/types";
import { LessonShapeError, looksLikeLesson, normalizeLesson } from "@/lib/lesson-normalize";
import {
  buildUserPrompt,
  extractContent,
  getModelChain,
  isRetryable,
  isSchemaRejection,
  parseJsonLoose,
  STORY_MODE_PROMPT,
  type ModelTarget,
} from "@/lib/lesson-json";

/**
 * Lesson generation across a prioritised chain of model targets.
 *
 * Three goals, in priority order:
 *  1. Never hard-fail a lesson request. Targets can all fail; the API route
 *     then serves a pre-authored lesson so the child still gets a session.
 *  2. One key is enough. OpenRouter is the primary path and the chain rotates
 *     through several models on that single key.
 *  3. Self-hosting is an environment change. Setting NEURA_LLM_BASE_URL puts a
 *     self-hosted OpenAI-compatible server ahead of every hosted provider,
 *     which is what makes data residency a config change and not a refactor.
 *
 * Parsing and target resolution live in ./lesson-json so they stay testable.
 */

const DEFAULT_TIMEOUT_MS = 45_000;

export function buildHeaders(target: ModelTarget): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${target.apiKey}`,
    "Content-Type": "application/json",
  };
  if (target.isOpenRouter) {
    headers["HTTP-Referer"] =
      process.env.NEURA_SITE_URL?.trim() || "https://neuraai-liard.vercel.app";
    headers["X-Title"] = "Neura AI Tutor";
  }
  return headers;
}

async function callOnce(
  target: ModelTarget,
  req: LessonRequest,
  useJsonHint: boolean
): Promise<unknown> {
  const body: Record<string, unknown> = {
    model: target.model,
    messages: [
      { role: "system", content: STORY_MODE_PROMPT },
      { role: "user", content: buildUserPrompt(req) },
    ],
    temperature: 0.85,
    max_tokens: 3000,
  };
  if (useJsonHint) body.response_format = { type: "json_object" };

  const configured = Number(process.env.NEURA_LLM_TIMEOUT_MS);
  const timeout = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;

  const res = await fetch(target.url, {
    method: "POST",
    headers: buildHeaders(target),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${detail.slice(0, 300)}`);
  }

  const content = extractContent(await res.json());
  if (!content) throw new Error("EMPTY_RESPONSE");
  return parseJsonLoose(content);
}

export class NoModelConfiguredError extends Error {
  constructor() {
    super(
      "NO_MODEL_CONFIGURED: set OPENROUTER_API_KEY, or NEURA_LLM_BASE_URL and NEURA_LLM_MODEL for self-hosting"
    );
    this.name = "NoModelConfiguredError";
  }
}

/**
 * Generate a lesson, walking the target chain until one returns a payload that
 * can be repaired into a valid lesson.
 */
export async function generateLesson(req: LessonRequest): Promise<Lesson> {
  const targets = getModelChain();
  if (targets.length === 0) throw new NoModelConfiguredError();

  const attempted: string[] = [];
  const failures: string[] = [];

  for (const target of targets) {
    const label = `${target.name}/${target.model}`;
    attempted.push(label);

    // Try with the structured-output hint, then without it if the server
    // rejects the parameter rather than the request as a whole.
    const modes: boolean[] = target.jsonHint ? [true, false] : [false];

    for (const useJsonHint of modes) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const raw = await callOnce(target, req, useJsonHint);
          if (!looksLikeLesson(raw)) {
            throw new LessonShapeError("MODEL_OUTPUT_NOT_A_LESSON");
          }
          return normalizeLesson(raw, req);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          failures.push(`${label}: ${message}`);

          if (useJsonHint && isSchemaRejection(message)) {
            // The hint is unsupported, not the model. Drop it silently.
            break;
          }
          if (!isRetryable(message)) break;
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      }
    }
  }

  throw new Error(
    `ALL_TARGETS_FAILED: tried ${attempted.join(", ")}. Last failures: ${failures
      .slice(-3)
      .join(" | ")}`
  );
}

export { getModelChain } from "@/lib/lesson-json";