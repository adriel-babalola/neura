import type { Lesson, Scene } from "@/lib/types";
import { normalizeLesson } from "@/lib/lesson-normalize";

/**
 * Offline lessons.
 *
 * These are real `Lesson` objects, not a parallel shape: the offline path runs
 * through the same normaliser, renderer and narrator as a generated lesson, so
 * losing the network degrades the content and never the experience.
 *
 * Boards are semantic (`right-triangle`, `number-line`, ...) rather than pasted
 * LaTeX, so they draw correctly on a board with no network and no KaTeX.
 */

type OfflineSeed = Omit<Lesson, "childName"> & { childName?: string };

function scene(
  index: number,
  narrative: string,
  speech: string,
  board: Scene["board"],
  tone: Scene["tone"]
): Scene {
  return { index, narrative, speech, board, tone };
}

const MATH_LESSON: OfflineSeed = {
  id: "offline-math-pythagoras",
  mode: "story",
  title: "The Shortest Path Home",
  subject: "Math",
  focus: "the Pythagorean theorem",
  intro: "You are offline, so here is a path through the park to walk with me.",
  reflection: "A squared plus b squared finds the way across.",
  scenes: [
    scene(
      0,
      "Imagine a rectangular park. You stand at one corner. Walking along the two edges takes longer than cutting straight across the grass.",
      "Imagine a rectangular park. You stand at one corner. Walking along the two edges takes longer than cutting straight across the grass.",
      [
        { kind: "diagram", diagram: "rectangle", labels: { w: "3", h: "4" } },
        {
          kind: "callout",
          text: "The diagonal is the shortest route.",
          tone: "hint",
        },
      ],
      "narrate"
    ),
    scene(
      1,
      "The two legs measure $3$ and $4$. Squaring gives $9$ and $16$. Adding them gives $25$.",
      "The two legs measure three and four. Squaring gives nine and sixteen. Adding them gives twenty five.",
      [
        { kind: "diagram", diagram: "right-triangle", labels: { a: "3", b: "4", c: "?" } },
        { kind: "equation", tex: "3^2 + 4^2 = 9 + 16 = 25", emphasis: "highlight" },
      ],
      "narrate"
    ),
    scene(
      2,
      "The rule is $a^2 + b^2 = c^2$. Take the square root of $25$ and the hypotenuse is $5$.",
      "The rule is a squared plus b squared equals c squared. Take the square root of twenty five and the hypotenuse is five.",
      [
        { kind: "equation", tex: "c = \\sqrt{a^2 + b^2}", emphasis: "box" },
        { kind: "equation", tex: "c = \\sqrt{25} = 5", emphasis: "highlight" },
      ],
      "excited"
    ),
  ],
  questions: [
    {
      id: "offline-q1",
      sceneIndex: 2,
      prompt: "The legs are 6 and 8. How long is the hypotenuse?",
      hint: "Square each leg, add them, then take the square root.",
      deeperHint: "Six squared is 36. Eight squared is 64. What is 36 plus 64?",
      answer: "10",
      accept: ["10", "ten"],
    },
  ],
};

const PHYSICS_LESSON: OfflineSeed = {
  id: "offline-physics-energy",
  mode: "story",
  title: "The Weight of Light",
  subject: "Physics",
  focus: "mass and energy",
  intro: "You are offline, so here is one idea worth keeping: mass is a store of energy.",
  reflection: "Energy changes form, but the total never changes.",
  scenes: [
    scene(
      0,
      "Einstein showed that mass and energy are two forms of the same property. $E = mc^2$.",
      "Einstein showed that mass and energy are two forms of the same property. E equals m c squared.",
      [{ kind: "equation", tex: "E = mc^2", emphasis: "box" }],
      "narrate"
    ),
    scene(
      1,
      "The speed of light is about $300{,}000{,}000$ metres per second. Squaring it is enormous, so even a tiny mass holds a lot of energy.",
      "The speed of light is about three hundred million metres per second. Squaring it is enormous, so even a tiny mass holds a lot of energy.",
      [
        { kind: "diagram", diagram: "number-line", labels: { c: "3 x 10^8" } },
        { kind: "equation", tex: "c \\approx 3 \\times 10^8 \\text{ m/s}", emphasis: "highlight" },
      ],
      "narrate"
    ),
    scene(
      2,
      "That is why a kilogram of matter releases far more than you would expect when it converts.",
      "That is why a kilogram of matter releases far more than you would expect when it converts.",
      [
        { kind: "callout", text: "Small mass, enormous energy.", tone: "success" },
      ],
      "excited"
    ),
  ],
  questions: [
    {
      id: "offline-q2",
      sceneIndex: 1,
      prompt: "In E = mc squared, what does c stand for?",
      hint: "It is the speed of light.",
      deeperHint: "Think about what travels fastest in a vacuum.",
      answer: "speed of light",
      accept: ["speed of light", "the speed of light", "light speed"],
    },
  ],
};

const DEFAULT_LESSON: OfflineSeed = {
  id: "offline-default-conservation",
  mode: "story",
  title: "Nothing Is Lost",
  subject: "Science",
  focus: "conservation of energy",
  intro: "You are offline, so here is one rule that holds everywhere.",
  reflection: "Energy changes shape, never amount.",
  scenes: [
    scene(
      0,
      "Energy cannot be made from nothing. It can only move from one form to another.",
      "Energy cannot be made from nothing. It can only move from one form to another.",
      [{ kind: "diagram", diagram: "grid" }],
      "narrate"
    ),
    scene(
      1,
      "The total at the end always matches the total at the start. Heat, motion and light are all the same energy wearing different clothes.",
      "The total at the end always matches the total at the start. Heat, motion and light are all the same energy wearing different clothes.",
      [
        { kind: "equation", tex: "\\Delta E = q + w", emphasis: "highlight" },
        { kind: "callout", text: "Form changes. Total stays the same.", tone: "success" },
      ],
      "narrate"
    ),
  ],
  questions: [
    {
      id: "offline-q3",
      sceneIndex: 1,
      prompt: "Can energy be created out of nothing?",
      hint: "Think about the first law of thermodynamics.",
      deeperHint: "If it could be created, the total at the end would be larger. Is that what happens?",
      answer: "no",
      accept: ["no", "it cannot", "cannot be created"],
    },
  ],
};

/** True when the client has no network route to the internet. */
export function isOffline(): boolean {
  if (typeof navigator !== "undefined") return !navigator.onLine;
  return false;
}

function pick(subject: string): OfflineSeed {
  const key = subject.toLowerCase().trim();
  if (/math|algebra|geometry|fraction|number|percent/.test(key)) return MATH_LESSON;
  if (/physics|science|energy|einstein|chemistry/.test(key)) return PHYSICS_LESSON;
  return DEFAULT_LESSON;
}

/**
 * A complete, playable lesson with no network.
 *
 * Normalised rather than hand-shaped, so scene ids, question wiring and speech
 * text are guaranteed to satisfy the same contract as generated content.
 */
export function getOfflineLesson(subject = "math", childName?: string): Lesson {
  const seed = pick(subject);
  return normalizeLesson({ ...seed, childName: childName || "friend" }, {
    child: {
      name: childName || "friend",
      age: 10,
      interest: "",
      learningStyle: "visual",
      frustration: "",
    },
    subject: seed.subject,
    struggle: seed.focus,
    context: "",
    mode: "story",
  });
}