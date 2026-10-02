import { NextResponse } from "next/server";
import { getModelChain } from "@/lib/lesson-json";
import { buildHeaders } from "@/lib/lesson-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT = 1000;

/**
 * Short free-text maths explanation.
 *
 * Exists for the Deep-Tech Lab demo, which measures round-trip latency. The
 * lesson path uses `/api/generate-lesson`. The provider key is applied here, on
 * the server, so it never reaches the browser bundle.
 */
export async function POST(request: Request) {
  let prompt = "";
  let subject = "math";
  try {
    const body = await request.json();
    if (typeof body?.prompt === "string") prompt = body.prompt.trim().slice(0, MAX_PROMPT);
    if (typeof body?.subject === "string") subject = body.subject.slice(0, 60);
  } catch {
    return NextResponse.json({ error: "MALFORMED_BODY" }, { status: 400 });
  }

  if (!prompt) return NextResponse.json({ error: "EMPTY_PROMPT" }, { status: 400 });

  const targets = getModelChain().filter((t) => t.apiKey);
  if (targets.length === 0) {
    return NextResponse.json({ error: "NO_PROVIDER_CONFIGURED" }, { status: 503 });
  }

  const system =
    "You are Neura, a patient maths tutor for a child. Explain in at most four short " +
    "sentences, no preamble. Put any formula in LaTeX between double dollar signs.";

  const failures: string[] = [];

  for (const target of targets) {
    try {
      const res = await fetch(target.url, {
        method: "POST",
        headers: buildHeaders(target),
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
        body: JSON.stringify({
          model: target.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: `Subject: ${subject}\n\n${prompt}` },
          ],
          temperature: 0.6,
          max_tokens: 320,
        }),
      });

      if (!res.ok) {
        failures.push(`${target.model}:${res.status}`);
        continue;
      }

      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? "";
      if (!content.trim()) {
        failures.push(`${target.model}:empty`);
        continue;
      }

      const match = content.match(/\$\$([\s\S]*?)\$\$/) ?? content.match(/\$([^$]+)\$/);
      return NextResponse.json({
        content,
        equation: match ? match[1].trim() : undefined,
        modelUsed: target.model,
      });
    } catch (err) {
      failures.push(`${target.model}:${err instanceof Error ? err.message : "ERR"}`);
    }
  }

  // Model ids and status codes only. Never echo the prompt, which is child input.
  console.warn(`[edge-ai] all targets failed: ${failures.join(", ").slice(0, 300)}`);
  return NextResponse.json({ error: "PROVIDER_UNAVAILABLE" }, { status: 502 });
}