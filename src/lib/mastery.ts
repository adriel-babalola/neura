import type { LessonDifficulty } from "@/lib/types";
import type { LessonRecord, ProgressStats } from "@/lib/history";

/**
 * Learner model.
 *
 * Turns raw history into the smallest useful instruction for the generator:
 * a short text signal describing where the child is already secure and what
 * keeps going wrong. Only aggregates are emitted. No child name, no question
 * text, no free-text profile fields, so widening the loop does not widen the
 * data we transmit.
 */
export type MasterySignal = {
  /** Appended to the generator prompt. Empty when there is no history yet. */
  context: string;
  /** Difficulty actually used for the next lesson. */
  difficulty: LessonDifficulty;
  /** Focus to seed the request with, when history suggests a better target. */
  suggestedFocus: string | null;
};

const EMPTY: MasterySignal = {
  context: "",
  difficulty: "intermediate",
  suggestedFocus: null,
};

/** Ordered so we can walk down a level when the child keeps needing help. */
const LADDER: LessonDifficulty[] = ["beginner", "intermediate", "advanced"];

function level(d: LessonDifficulty): number {
  const i = LADDER.indexOf(d);
  return i === -1 ? 1 : i;
}

/**
 * First-try accuracy is the only trustworthy signal. Questions answered after a
 * hint were helped, not known, so counting them inflates mastery and makes the
 * tutor misjudge how hard to go.
 */
export function firstTryAccuracy(stats: ProgressStats): number {
  if (stats.totalQuestions === 0) return 0;
  return stats.firstTryCorrect / stats.totalQuestions;
}

export function buildMasterySignal(
  records: LessonRecord[],
  stats: ProgressStats,
  requested: LessonDifficulty = "intermediate",
): MasterySignal {
  if (records.length === 0) {
    return { ...EMPTY, difficulty: requested };
  }

  const accuracy = firstTryAccuracy(stats);
  const parts: string[] = [];

  // ── Difficulty adaptation
  let difficulty = requested;
  if (accuracy < 0.4 && requested !== "beginner") {
    difficulty = LADDER[Math.max(0, level(requested) - 1)];
    parts.push(
      `Recent first-try accuracy is ${Math.round(accuracy * 100)}%, so ease off to ${difficulty} difficulty and open with a worked example before asking anything.`
    );
  } else if (accuracy > 0.9 && requested === "beginner" && stats.totalQuestions >= 6) {
    difficulty = "intermediate";
    parts.push(
      `First-try accuracy is ${Math.round(accuracy * 100)}% across ${stats.totalQuestions} questions, so step up to intermediate and add one harder reasoning step.`
    );
  }

  // ── Subject coverage
  const subjects = Object.entries(stats.subjectBreakdown).sort((a, b) => b[1] - a[1]);
  if (subjects.length > 0) {
    const top = subjects
      .slice(0, 3)
      .map(([s, n]) => `${s} (${n})`)
      .join(", ");
    parts.push(`Lessons so far by subject: ${top}.`);
  }

  // ── Recurrent struggle, weighted toward recent attempts
  // Recent records sit at the head of the list, so walking it front to back
  // surfaces what the child is struggling with *now*, not what they fought
  // three sessions ago.
  const focusWeights = new Map<string, number>();
  records.forEach((r, index) => {
    const focus = r.focus?.trim();
    if (!focus) return;
    const recency = 1 + (records.length - index) / records.length;
    const clueRate = r.questionsTotal > 0 ? 1 - r.questionsCorrect / r.questionsTotal : 0;
    focusWeights.set(focus, (focusWeights.get(focus) ?? 0) + recency * (1 + clueRate));
  });

  const topFocus = [...focusWeights.entries()].sort((a, b) => b[1] - a[1])[0];
  let suggestedFocus: string | null = null;
  if (topFocus) {
    suggestedFocus = topFocus[0];
    parts.push(`Recurring struggle: "${topFocus[0]}". Reuse this as the opening hook and do not skip past it.`);
  }

  // ── Streak, for pacing rather than content
  if (stats.streak.current >= 3) {
    parts.push(`On a ${stats.streak.current}-day streak, so keep the session short and finish on a win.`);
  }

  return { context: parts.join(" "), difficulty, suggestedFocus };
}