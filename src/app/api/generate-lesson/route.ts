import { NextResponse } from "next/server";
import { generateLesson } from "@/lib/gemini";
import type { LessonRequest, LessonDifficulty } from "@/lib/types";

export async function POST(request: Request) {
  let body: LessonRequest;
  try {
    const raw = await request.json();
    body = {
      child: raw.child,
      subject: raw.subject,
      struggle: raw.struggle,
      context: raw.context,
      mode: raw.mode,
      difficulty: raw.difficulty as LessonDifficulty | undefined,
    };
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  try {
    if (!body.child?.name || !body.subject || !body.struggle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lesson = await generateLesson(body);
    return NextResponse.json({ lesson });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    console.error("[generate-lesson] ERROR:", message);
    
    if (message === "NO_KEY") {
      return NextResponse.json(
        { error: "NO_KEY", detail: "Set OPENROUTER_API_KEY or GROQ_API_KEY in environment variables." },
        { status: 503 }
      );
    }
    if (message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "RATE_LIMITED", detail: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: message, detail: "All AI providers failed to generate a lesson. Providers attempted: OpenRouter, Groq, Gemini. Please check your API keys or try again in a moment." },
      { status: 500 }
    );
  }
}
