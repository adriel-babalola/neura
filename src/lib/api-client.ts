import { getOfflineLesson, isOffline } from "./edge-fallback";

/**
 * Client-side AI transport.
 *
 * The provider key lives only on the server. This module therefore never reads
 * a `NEXT_PUBLIC_*` variable: anything prefixed that way is inlined into the
 * browser bundle, which would publish the key to every visitor. Requests go to
 * our own route handlers, which hold the key server-side.
 */

export interface EdgeAIResponse {
  content: string;
  equation?: string;
  modelUsed: string;
  latencyMs: number;
  status: "success" | "offline-mode" | "error-fallback";
}

export interface FetchEdgeAIOptions {
  /** Subject hint used to pick the offline lesson. */
  subject?: string;
  childName?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 20000;

export type PromptMeasurement = {
  /** Text actually sent. */
  sent: string;
  chars: number;
  /** Rough token estimate at ~4 characters per token. */
  approxTokens: number;
  truncated: boolean;
  summary: string;
};

/**
 * Report what a prompt will actually cost on the wire.
 *
 * The previous implementation here stripped stop words to hit a word budget.
 * That is not compression, it is vandalism: dropping "the", "a" and "to" from
 * a maths explanation changes what the model reads. Bandwidth is now reduced by
 * capping length, which is honest and reversible, and the saving is reported
 * rather than hidden.
 */
export function measurePrompt(prompt: string, maxChars = 1000): PromptMeasurement {
  const clean = prompt.trim().replace(/\s+/g, " ");
  const sent = clean.slice(0, maxChars);
  const truncated = sent.length < clean.length;
  const approxTokens = Math.ceil(sent.length / 4);
  return {
    sent,
    chars: sent.length,
    approxTokens,
    truncated,
    summary: truncated
      ? `${clean.length} chars truncated to ${sent.length} (~${approxTokens} tokens)`
      : `${sent.length} chars, ~${approxTokens} tokens, sent as-is`,
  };
}

/**
 * Ask for a short maths explanation.
 *
 * Kept as a thin client because the demo page measures round-trip time. The
 * real lesson path uses `/api/generate-lesson`.
 */
export async function fetchEdgeAI(
  prompt: string,
  options: FetchEdgeAIOptions = {}
): Promise<EdgeAIResponse> {
  const startTime = Date.now();
  const { subject = "math", childName, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const question = prompt.trim().slice(0, 1000);

  if (isOffline()) {
    const lesson = getOfflineLesson(subject, childName);
    return {
      content: lesson.intro + " " + lesson.scenes[0].speech,
      equation: lesson.scenes[0].board?.[0]?.kind === "equation" ? lesson.scenes[0].board[0].tex : undefined,
      modelUsed: "Edge Resilience Engine (local)",
      latencyMs: Date.now() - startTime,
      status: "offline-mode",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/edge-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ prompt: question, subject }),
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`edge-ai ${res.status}`);
    const data = (await res.json()) as { content?: string; equation?: string; modelUsed?: string };

    return {
      content: typeof data.content === "string" ? data.content : "",
      equation: data.equation,
      modelUsed: typeof data.modelUsed === "string" ? data.modelUsed : "unknown",
      latencyMs: Date.now() - startTime,
      status: "success",
    };
  } catch {
    clearTimeout(timer);
    const lesson = getOfflineLesson(subject, childName);
    return {
      content: lesson.intro + " " + lesson.scenes[0].speech,
      modelUsed: "Edge Fallback",
      latencyMs: Date.now() - startTime,
      status: "error-fallback",
    };
  } finally {
    clearTimeout(timer);
  }
}