import type {
  BoardStroke,
  CalloutTone,
  DiagramKind,
  Emphasis,
  Lesson,
  LessonRequest,
  Question,
  Scene,
  SceneTone,
} from "@/lib/types";
import { latexToSpeech } from "@/lib/speech-text";

/**
 * Coerce raw model output into a Lesson that satisfies the renderer.
 *
 * Language models are not a reliable source of schema. A free or mid-sized
 * open-weight model will occasionally emit a missing field, a misaligned
 * sceneIndex, a duplicated question, or board instructions that cannot be
 * drawn. Rather than failing the whole request and dropping the learner back
 * to a generic lesson, this module repairs what can be repaired and throws
 * only when the payload is genuinely unusable.
 *
 * The most important repair is `speech`: if the model did not supply spoken
 * text, it is derived from the narrative with LaTeX verbalised. That is what
 * stops a tutor reading "a caret two plus b caret two" out loud.
 */

const TONES: SceneTone[] = ["narrate", "curious", "excited", "encourage"];
const DIAGRAMS: DiagramKind[] = [
  "right-triangle",
  "rectangle",
  "circle",
  "number-line",
  "grid",
];
const EMPHASIS: Emphasis[] = ["none", "highlight", "box"];
const CALLOUT_TONES: CalloutTone[] = ["hint", "warning", "success"];

const MAX_TEXT = 2000;
const MAX_ACCEPT = 12;

function asString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed.slice(0, MAX_TEXT) : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function oneOf<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** Trim LaTeX to something KaTeX can plausibly render. */
function sanitizeTex(value: unknown): string {
  const tex = asString(value);
  if (!tex) return "";
  if (tex.length > 400) return "";
  // Balance check: unbalanced braces will throw inside KaTeX.
  let depth = 0;
  for (const ch of tex) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth < 0) return "";
  }
  if (depth !== 0) return "";
  return tex;
}

function sanitizeStroke(raw: unknown): BoardStroke | null {
  const stroke = asRecord(raw);
  const kind = stroke.kind;

  if (kind === "equation") {
    const tex = sanitizeTex(stroke.tex);
    if (!tex) return null;
    const out: BoardStroke = {
      kind: "equation",
      tex,
      emphasis: oneOf(stroke.emphasis, EMPHASIS, "none"),
    };
    const note = asString(stroke.note);
    if (note) out.note = note;
    return out;
  }

  if (kind === "diagram") {
    const diagram = oneOf(stroke.diagram, DIAGRAMS, "right-triangle");
    const out: BoardStroke = { kind: "diagram", diagram };
    const labelsRaw = asRecord(stroke.labels);
    const labels: Record<string, string> = {};
    let labelCount = 0;
    for (const [key, value] of Object.entries(labelsRaw)) {
      if (labelCount >= 6) break;
      const label = asString(value);
      if (!label || label.length > 12) continue;
      labels[key.slice(0, 12)] = label;
      labelCount++;
    }
    if (labelCount) out.labels = labels;
    const note = asString(stroke.note);
    if (note) out.note = note;
    return out;
  }

  if (kind === "callout") {
    const text = asString(stroke.text);
    if (!text) return null;
    return {
      kind: "callout",
      text,
      tone: oneOf(stroke.tone, CALLOUT_TONES, "hint"),
    };
  }

  return null;
}

function sanitizeBoard(raw: unknown): BoardStroke[] | undefined {
  const strokes = asArray(raw)
    .slice(0, 8)
    .map(sanitizeStroke)
    .filter((s): s is BoardStroke => s !== null);
  return strokes.length ? strokes : undefined;
}

/** Build a stable, collision-resistant question id. */
function questionId(sceneIndex: number, position: number): string {
  return `q${sceneIndex}_${position}`;
}

function normalizeQuestion(
  raw: unknown,
  sceneIndex: number,
  position: number,
  fallbackAnswer: string
): Question | null {
  const q = asRecord(raw);
  const prompt = asString(q.prompt);
  if (!prompt) return null;

  const answer = asString(q.answer, fallbackAnswer);
  const acceptRaw = asArray(q.accept)
    .slice(0, MAX_ACCEPT)
    .map((v) => asString(v))
    .filter(Boolean);

  // The canonical answer must always be accepted, otherwise a correct reply
  // is graded wrong.
  const accept = Array.from(new Set([answer, ...acceptRaw].filter(Boolean)));

  return {
    id: asString(q.id) || questionId(sceneIndex, position),
    sceneIndex,
    prompt,
    hint: asString(q.hint, "Think about what the story just showed you."),
    deeperHint: asString(q.deeperHint, asString(q.hint, "Try breaking it into smaller steps.")),
    answer,
    accept,
  };
}

export class LessonShapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonShapeError";
  }
}

/**
 * Repair and validate raw model output.
 * Throws `LessonShapeError` only when nothing usable can be recovered.
 */
export function normalizeLesson(raw: unknown, req: LessonRequest): Lesson {
  const root = asRecord(raw);

  const rawScenes = asArray(root.scenes);
  const usableScenes = rawScenes.filter((s) => {
    const scene = asRecord(s);
    return asString(scene.narrative).length > 0;
  });

  if (usableScenes.length === 0) {
    throw new LessonShapeError("NO_SCENES: model returned no scene with narrative text");
  }

  const topLevelQuestions = asArray(root.questions);
  const scenes: Scene[] = [];
  const questions: Question[] = [];
  const claimedIds = new Set<string>();

  usableScenes.slice(0, 8).forEach((rawScene, index) => {
    const rs = asRecord(rawScene);
    const narrative = asString(rs.narrative);
    const scene: Scene = {
      index,
      narrative,
      tone: oneOf(rs.tone, TONES, "narrate"),
    };

    // Prefer the model's spoken text, otherwise verbalise the narrative.
    const spoken = asString(rs.speech) || asString(rs.spoken);
    scene.speech = spoken ? latexToSpeech(spoken) : latexToSpeech(narrative);

    const board = sanitizeBoard(rs.board);
    if (board) scene.board = board;

    // Prefer a question embedded in the scene, otherwise claim one of the
    // top-level questions that has not yet been attached to a scene.
    let question: Question | null = null;
    const embedded = asRecord(rs.question);
    if (asString(embedded.prompt)) {
      question = normalizeQuestion(embedded, index, 0, asString(embedded.answer));
    } else if (asString(rs.question)) {
      question = normalizeQuestion(
        { prompt: asString(rs.question), answer: asString(rs.answer) },
        index,
        0,
        ""
      );
    } else {
      for (let i = 0; i < topLevelQuestions.length; i++) {
        const candidate = normalizeQuestion(topLevelQuestions[i], index, i, "");
        if (candidate && !claimedIds.has(candidate.id)) {
          claimedIds.add(candidate.id);
          question = candidate;
          break;
        }
      }
    }

    if (question) {
      question.sceneIndex = index;
      claimedIds.add(question.id);
      scene.question = question;
      questions.push(question);
    }

    scenes.push(scene);
  });

  // A lesson with no questions is not Socratic, so reject it rather than
  // silently shipping a lecture.
  if (questions.length === 0) {
    throw new LessonShapeError("NO_QUESTIONS: model returned no usable question");
  }

  return {
    id: asString(root.id) || `lesson_${req.subject}_${scenes.length}`,
    mode: "story",
    title: asString(root.title, `${req.subject} adventure`),
    subject: asString(root.subject, req.subject),
    focus: asString(root.focus, req.struggle || req.subject),
    childName: asString(root.childName, req.child.name),
    intro: asString(root.intro),
    reflection: asString(root.reflection),
    scenes,
    questions,
  };
}

/** True when the payload has enough shape to be worth normalising. */
export function looksLikeLesson(raw: unknown): boolean {
  const root = asRecord(raw);
  return (
    Array.isArray(root.scenes) &&
    root.scenes.some((s) => asString(asRecord(s).narrative).length > 0)
  );
}