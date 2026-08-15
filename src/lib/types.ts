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

export type LessonMode = "board" | "story";

export type BoardLine =
  | { kind: "text"; text: string; color?: string }
  | { kind: "math"; latex: string }
  | { kind: "divider" };

export type Question = {
  id: string;
  sceneIndex: number;
  prompt: string;
  hint: string;
  deeperHint: string;
  answer: string;
  accept: string[];
};

export type LessonScene = {
  lines: BoardLine[];
};

export type Lesson = {
  id: string;
  mode: LessonMode;
  difficulty?: LessonDifficulty;
  title: string;
  subject: string;
  focus: string;
  childName: string;
  intro: string;
  scenes: LessonScene[];
  questions: Question[];
  reflection: string;
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
