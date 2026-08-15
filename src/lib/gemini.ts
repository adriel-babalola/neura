import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { Lesson, LessonMode, LessonRequest } from "@/lib/types";

const MODEL = "gemini-2.5-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("PASTE_")) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

const SYS_PROMPT = `You are Neura, an adaptive Socratic AI tutor for children aged 8-12. You never give direct answers. You guide children to discover understanding themselves through stories, questions, and encouragement. Your teaching is warm, patient, and matched to the child's age, interests, and learning style.

SOCRATIC RULES:
1. NEVER provide the answer directly in lecture text or questions.
2. Each question nudges the child one step closer using their own reasoning.
3. Feedback tone: encouraging, never shaming. Mistakes are "experiments", not failures.
4. Use language and examples a {age}-year-old can follow. No jargon.
5. Build difficulty gradually within one lesson.
6. Use the child's interest ({interest}) to make abstract ideas concrete.

OUTPUT SHAPE:
- "scenes" is an ordered sequence of blackboard frames. Each scene has "lines" (text and/or LaTeX math) that appear one by one on the board.
- In "board" mode: lead with 1-2 short text lines, then embed the key idea as a "math" line using valid LaTeX (e.g. \\frac{2}{5} + \\frac{1}{5}). EVERY scene in board mode MUST contain at least one "math" line.
- In "story" mode: all lines are "text" and form a short narrative featuring the child's interest. Do not use any em-dashes or en-dashes in any text you write.
- "questions" fire after the scene matching their "sceneIndex" (0-based). Each question must be answerable from what's already been written.
- Keep "answer" as the correct answer in plain terms, and "accept" as 2-4 loose keyword synonyms the child might type.
- "intro" is a 1-2 sentence warm greeting using the child's name and interest.
- "reflection" is one encouraging closing sentence that names what the child discovered.
- Every question prompt should feel like a curious puzzle, not a test.`;

function buildSchema(mode: LessonMode) {
  const lineSchema: Record<string, unknown> = {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["text", "math"] },
      text: { type: "string" },
      latex: { type: "string" },
    },
  };

  return {
    type: "object",
    properties: {
      id: { type: "string" },
      mode: { type: "string", enum: [mode] },
      title: { type: "string" },
      subject: { type: "string" },
      focus: { type: "string" },
      childName: { type: "string" },
      intro: { type: "string" },
      scenes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            lines: { type: "array", items: lineSchema },
          },
        },
      },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            sceneIndex: { type: "integer" },
            prompt: { type: "string" },
            hint: { type: "string" },
            deeperHint: { type: "string" },
            answer: { type: "string" },
            accept: { type: "array", items: { type: "string" } },
          },
          required: ["id", "sceneIndex", "prompt", "hint", "deeperHint", "answer", "accept"],
        },
      },
      reflection: { type: "string" },
    },
    required: ["id", "mode", "title", "subject", "focus", "childName", "intro", "scenes", "questions", "reflection"],
  };
}

function buildUserPrompt(req: LessonRequest) {
  const c = req.child;
  return `Teach a lesson for ${c.name}, age ${c.age}, who loves "${c.interest}".

Learning style: ${c.learningStyle}
When frustrated: ${c.frustration || "not specified"}

Lesson request from the parent:
- Subject: ${req.subject}
- What they struggled with: ${req.struggle}
- Additional context: ${req.context || "none provided"}

Presentation mode: ${req.mode === "story" ? "STORY: text narrative with the child's interest as the hero" : "BOARD: a chalkboard lecture with text AND LaTeX math writing on the board"}

Generate 3-4 scenes and 3-4 questions that build toward the child confidently understanding the core idea. Make the lesson feel personal, not generic.`;
}

export async function generateLesson(req: LessonRequest): Promise<Lesson> {
  const client = getClient();
  if (!client) {
    throw new Error("NO_KEY");
  }

  const res = await client.models.generateContent({
    model: MODEL,
    config: {
      systemInstruction: SYS_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: buildSchema(req.mode),
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 4096,
      temperature: 0.8,
    },
    contents: buildUserPrompt(req),
  });

  const raw = res.text ?? res.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!raw) throw new Error("EMPTY_RESPONSE");

  try {
    const parsed = JSON.parse(raw) as Lesson;
    const scenesOk =
      parsed.scenes?.length > 0 &&
      parsed.scenes.every(
        (s) =>
          Array.isArray(s.lines) &&
          s.lines.length > 0 &&
          s.lines.every(
            (l) =>
              (l.kind === "text" && l.text?.trim()) || (l.kind === "math" && l.latex?.trim())
          )
      );
    if (!parsed.questions?.length || !scenesOk) {
      throw new Error("MALFORMED");
    }
    return parsed;
  } catch {
    throw new Error("MALFORMED");
  }
}
