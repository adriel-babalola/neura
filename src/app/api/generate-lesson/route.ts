import { NextResponse } from "next/server";
import { generateLesson } from "@/lib/lesson-generator";
import type { LessonRequest, LessonDifficulty } from "@/lib/types";
import { fallbackLesson } from "@/lib/fallback";
import { normalizeLesson } from "@/lib/lesson-normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);
const LEARNING_STYLES = new Set(["visual", "auditory", "kinesthetic", "independent", "social"]);

function str(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Validate and bound the incoming request.
 * Everything is length-capped here so an oversized or hostile payload cannot
 * reach the model provider or the renderer.
 */
function parseRequest(raw: unknown): { ok: true; body: LessonRequest } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "MALFORMED_BODY" };
  const r = raw as Record<string, unknown>;

  const childRaw = (r.child ?? {}) as Record<string, unknown>;
  const name = str(childRaw.name, 60);
  const subject = str(r.subject, 80);
  const struggle = str(r.struggle, 200);

  if (!name) return { ok: false, error: "MISSING_CHILD_NAME" };
  if (!subject) return { ok: false, error: "MISSING_SUBJECT" };
  if (!struggle) return { ok: false, error: "MISSING_STRUGGLE" };

  const rawAge = Number(childRaw.age);
  const age = Number.isFinite(rawAge) ? Math.min(18, Math.max(5, Math.round(rawAge))) : 10;

  const learningStyle = str(childRaw.learningStyle, 20);

  const difficultyRaw = str(r.difficulty, 20);

  return {
    ok: true,
    body: {
      child: {
        name,
        age,
        interest: str(childRaw.interest, 60),
        learningStyle: (LEARNING_STYLES.has(learningStyle)
          ? learningStyle
          : "visual") as LessonRequest["child"]["learningStyle"],
        frustration: str(childRaw.frustration, 200),
      },
      subject,
      struggle,
      context: str(r.context, 500),
      mode: "story",
      difficulty: (DIFFICULTIES.has(difficultyRaw)
        ? difficultyRaw
        : undefined) as LessonDifficulty | undefined,
    },
  };
}

export async function POST(request: Request) {
  let parsed: ReturnType<typeof parseRequest>;
  try {
    parsed = parseRequest(await request.json());
  } catch {
    return NextResponse.json({ error: "MALFORMED_BODY" }, { status: 400 });
  }

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.body;

  try {
    const lesson = await generateLesson(body);
    return NextResponse.json({ lesson });
  } catch (err) {
    // Log the failure shape only. The request carries a minor's profile, so it
    // must not end up in logs.
    const message = err instanceof Error ? err.message : "UNKNOWN";
    console.warn(`[generate-lesson] generation failed, serving fallback: ${message.slice(0, 240)}`);

    // A lesson is the product. A generation failure degrades the content, not
    // the experience, so the child still gets a complete playable session.
    try {
      const lesson = normalizeLesson(fallbackLesson, body);
      return NextResponse.json({ lesson, offlineFallback: true }, { status: 200 });
    } catch {
      return NextResponse.json(
        { error: "LESSON_GENERATION_FAILED" },
        { status: 502 }
      );
    }
  }
}