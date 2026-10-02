export type Role = "parent" | "child";

export type LearningStyle = "visual" | "auditory" | "kinesthetic" | "independent" | "social";

export type ParentProfile = {
  name: string;
  relation: string;
};

export type ChildProfile = {
  name: string;
  age: number;
  interest: string;
  learningStyle: LearningStyle;
  frustration: string;
};

export type Profile = {
  role: Role;
  parent: ParentProfile;
  child: ChildProfile;
  onboarded: boolean;
};

export type LessonMode = "story";

export type Question = {
  id: string;
  sceneIndex: number;
  prompt: string;
  hint: string;
  deeperHint: string;
  answer: string;
  accept: string[];
};

/** Diagrams the board renderer can draw deterministically from JSON. */
export type DiagramKind =
  | "right-triangle"
  | "rectangle"
  | "circle"
  | "number-line"
  | "grid";

export type Emphasis = "none" | "highlight" | "box";

export type CalloutTone = "hint" | "warning" | "success";

/**
 * A single drawable instruction on the chalkboard.
 *
 * The model emits semantic operations instead of raw display strings so the
 * client can render, animate and highlight deterministically. This is what
 * lets every lesson get a real diagram rather than only text containing a `$`.
 */
export type BoardStroke =
  | {
      kind: "equation";
      tex: string;
      note?: string;
      emphasis?: Emphasis;
    }
  | {
      kind: "diagram";
      diagram: DiagramKind;
      labels?: Record<string, string>;
      note?: string;
    }
  | {
      kind: "callout";
      text: string;
      tone?: CalloutTone;
    };

/** Narration emotion, mapped to a voice profile by the TTS layer. */
export type SceneTone = "narrate" | "curious" | "excited" | "encourage";

export type Scene = {
  index: number;
  narrative: string;
  /**
   * Plain-spoken narration text, already free of LaTeX.
   * Supplied by the model when available and derived server-side otherwise,
   * so the TTS engine never reads out maths markup.
   */
  speech?: string;
  tone?: SceneTone;
  board?: BoardStroke[];
  question?: Question | null;
};

export type Lesson = {
  id: string;
  mode: "story";
  title: string;
  subject: string;
  focus: string;
  childName: string;
  intro: string;
  reflection: string;
  scenes: Scene[];
  questions: Question[];
};

export type LessonDifficulty = "beginner" | "intermediate" | "advanced";

export type LessonRequest = {
  child: ChildProfile;
  subject: string;
  struggle: string;
  context: string;
  mode: LessonMode;
  difficulty?: LessonDifficulty;
};
