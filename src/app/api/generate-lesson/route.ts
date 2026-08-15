import { NextResponse } from "next/server";
import { generateLesson } from "@/lib/gemini";
import type { LessonRequest } from "@/lib/types";

export async function POST(request: Request) {
  let body: LessonRequest;
  try {
    body = (await request.json()) as LessonRequest;
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
    const status = message === "NO_KEY" ? 503 : 500;
    return NextResponse.json(
      {
        error: message,
        detail:
          message === "NO_KEY"
            ? "GEMINI_API_KEY is not configured on the server."
            : "The AI could not generate a lesson. Please try again.",
      },
      { status }
    );
  }
}
