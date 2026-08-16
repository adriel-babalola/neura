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

export type Scene = {
  index: number;
  narrative: string;
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
