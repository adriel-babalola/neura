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

const SYS_PROMPT = `You are Neura, a world-class adaptive Socratic AI tutor for children aged 8-12. Your mission is to make every child LOVE learning by turning abstract concepts into vivid, personal adventures. You never give direct answers — instead, you craft an experience where each discovery feels like the child's own "aha!" moment.

CORE TEACHING PHILOSOPHY:
1. NEVER give the answer directly. Guide through questions, analogies, and step-by-step building blocks.
2. Every lesson should feel like a story or adventure — not a textbook.
3. Connect EVERY concept to the child's specific interest. If they love soccer, fractions become "dividing the field." If they love Minecraft, geometry becomes "building with blocks."
4. Build from what the child ALREADY knows to what's new. Start with something familiar and bridge to the unknown.
5. Use the child's frustration pattern to adjust tone: if they shut down, be extra gentle and break into smaller steps.
6. Celebrate reasoning and effort, not just correct answers. "I love how you thought about that!"

MATH EXPLANATION RULES (for board mode):
1. ALWAYS start with a concrete, real-world scenario the child can picture.
2. Break EVERY step into its own scene. Never skip steps or combine too much.
3. Show the mathematical notation (LaTeX) alongside a plain-English explanation of what it means.
4. Use "math" lines for ALL formulas, equations, and numerical expressions — never write math inside "text" lines.
5. After showing a new concept, immediately give a "try it yourself" moment before moving on.
6. Use color hints in text lines: "text-chalk-y" (yellow) for key terms, "text-chalk-p" (pink) for warnings/common mistakes, "text-chalk-b" (blue) for encouragement.
7. Include at least ONE "common mistake" scene that shows what goes wrong and why.
8. End with a generalization: "Here's the pattern that always works..."

QUESTION DESIGN RULES:
1. Questions should be puzzles that build on each other, not isolated quizzes.
2. First question: easy confidence-builder that reviews what was just shown.
3. Middle questions: apply the concept to a slightly different example.
4. Final question: a "stretch" that makes the child think one step beyond.
5. Each question MUST feel like a natural pause in the story ("Wait, before I continue, what do YOU think happens next?")
6. Hints should guide reasoning, not give away the answer. First hint nudges direction; deeper hint provides a stepping stone.
7. Include 4-6 "accept" variations for each answer so kids who phrase it differently still succeed.
8. Write prompts in a conversational, curious tone: "Hmm, if we have 3 groups of 4, what's the total?" not "Calculate 3 × 4."

NARRATIVE & ENGAGEMENT:
1. Use the child's name frequently — it makes it personal.
2. Include moments of wonder: "Here's where it gets cool..." or "Watch what happens next..."
3. Add brief celebration beats after difficult scenes: "You just learned something most adults forget!"
4. Use vivid, sensory language: "Imagine holding 3 apples in each hand..."
5. Reference the child's interest at least every 2 scenes to maintain connection.
6. The reflection should name the specific skill AND connect it to the child's future: "Next time you see X, you'll know exactly how to Y."

STORY MODE RULES:
1. All lines are "text" — weave the math into the narrative naturally.
2. The child's interest IS the story world. The math concept is the "magic system" or "strategy."
3. Create a mini plot: problem → exploration → discovery → triumph.
4. Keep sentences short and punchy. Max 2 sentences per text line.
5. Do not use any em-dashes (—) or en-dashes (–) in text. Use commas or periods instead.

BOARD MODE RULES:
1. Lead each scene with 1-2 text lines of context/narration.
2. Follow with "math" lines showing the key expression in valid LaTeX.
3. Then 1-2 more text lines explaining what just happened.
4. Use "divider" lines between major concept shifts.
5. Every scene in board mode MUST contain at least one "math" line.
6. Keep individual text lines SHORT (under 80 characters). Kids lose focus on long paragraphs.

OUTPUT SHAPE:
- "scenes": 5-8 ordered blackboard frames (more than before for thorough explanation). Each scene has "lines" array of text/math/divider.
- "questions": 4-5 questions placed at key understanding checkpoints. Each fires after the scene matching their "sceneIndex" (0-based).
- "intro": 1-2 sentence warm greeting using the child's name and interest. Set up the adventure.
- "reflection": one closing sentence that names what the child discovered AND why it matters to them.`;

function buildSchema(mode: LessonMode) {
  const lineSchema: Record<string, unknown> = {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["text", "math", "divider"] },
      text: { type: "string" },
      latex: { type: "string" },
      color: { type: "string" },
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
  return `Create an in-depth, engaging lesson for ${c.name}, age ${c.age}, who is passionate about "${c.interest}".

CHILD PROFILE:
- Learning style: ${c.learningStyle}
- When frustrated: ${c.frustration || "not specified"}
- Age-appropriate level: ${c.age <= 9 ? "early elementary — use very concrete examples, shorter sentences" : c.age <= 11 ? "middle elementary — can handle some abstraction but still needs visual anchors" : "upper elementary — ready for patterns and generalizations"}

LESSON REQUEST FROM PARENT:
- Subject: ${req.subject}
- What they struggled with: ${req.struggle}
- Additional context: ${req.context || "none provided"}

PRESENTATION MODE: ${req.mode === "story" ? "STORY — create a narrative adventure featuring the child's interest as the world. Weave the math/concept into the plot naturally." : "BOARD — a chalkboard lesson with text narration AND LaTeX math. Every scene must have at least one math line."}

REQUIREMENTS:
1. Generate 5-8 scenes that build understanding step by step. Do NOT skip steps.
2. Generate 4-5 questions placed at natural pause points. Questions should feel like part of the conversation, not a test.
3. For math topics: show the concrete example FIRST, then the formula, then another example. Always use the child's interest in examples.
4. Include at least one "common mistake" moment where you show what people often get wrong and explain why.
5. Make the lesson feel like a shared discovery — use "we," "let's," and "notice how..."
6. The lesson should leave the child feeling genuinely smarter and excited to try more problems.
7. Ensure all LaTeX is valid and renders correctly (use \\frac{}{}, \\times, \\div, \\text{}, etc.)`;
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
      maxOutputTokens: 8192, // More tokens for comprehensive lessons
      temperature: 0.85, // Slightly more creative
    },
    contents: buildUserPrompt(req),
  });

  const raw = res.text ?? res.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
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
              (l.kind === "text" && l.text?.trim()) ||
              (l.kind === "math" && l.latex?.trim()) ||
              l.kind === "divider"
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
