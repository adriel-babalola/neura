"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  BookOpenText,
  Calculator,
  FlaskConical,
  Presentation,
  Puzzle,
  Sparkles,
} from "lucide-react";
import { Button, Card, Logo, Textarea } from "@/components/ui";
import { useProfile } from "@/lib/profile";
import { useLessonStore } from "@/lib/lesson-store";
import { useMounted } from "@/lib/use-mounted";
import type { Lesson, LessonMode } from "@/lib/types";

const SUBJECTS = [
  { label: "Math", icon: Calculator },
  { label: "English", icon: BookOpen },
  { label: "Logic", icon: Puzzle },
  { label: "Science", icon: FlaskConical },
];

const SUGGESTIONS = [
  "Fractions are really confusing",
  "Had trouble with multiplication tables",
  "Struggles with word problems",
  "Can't understand place value",
];

const MODES: { value: LessonMode; label: string; icon: typeof Presentation; desc: string }[] = [
  {
    value: "board",
    label: "Chalkboard",
    icon: Presentation,
    desc: "A teacher-style board where the lesson and math write themselves in front of them.",
  },
  {
    value: "story",
    label: "Story",
    icon: BookOpenText,
    desc: "A short adventure starring their favorite interest, with puzzles along the way.",
  },
];

export default function ParentPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const mounted = useMounted();
  const { saveLesson } = useLessonStore();
  const [subject, setSubject] = useState("");
  const [struggle, setStruggle] = useState("");
  const [context, setContext] = useState("");
  const [mode, setMode] = useState<LessonMode>("board");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  if (!mounted) return null;

  if (!profile?.onboarded) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas px-6">
        <div className="space-y-4 text-center">
          <p className="text-muted">No child profile yet.</p>
          <Button onClick={() => router.push("/onboarding")}>Set up onboarding</Button>
        </div>
      </main>
    );
  }

  const child = profile.child;

  const generate = async () => {
    if (!subject || !struggle.trim() || generating) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child,
          subject,
          struggle: struggle.trim(),
          context: context.trim(),
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Generation failed");

      const lesson: Lesson = data.lesson;
      saveLesson(lesson);
      router.push("/child/latest");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-canvas px-6 py-10">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 w-full max-w-2xl space-y-8">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2.5 text-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-dim font-display text-sm font-bold text-accent">
              {child.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="leading-tight">
              <p className="font-display font-semibold text-ink">{child.name}</p>
              <p className="text-xs text-muted">
                Age {child.age} · Loves {child.interest}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            What should {child.name} learn today?
          </h1>
          <p className="text-muted">
            Give Neura a little context (what happened in class, what&apos;s confusing) and it
            will build a lesson around {child.name}&apos;s world.
          </p>
        </div>

        <Card className="space-y-6 p-6">
          <div>
            <p className="mb-3 font-display text-sm font-semibold text-ink">Subject</p>
            <div className="grid grid-cols-4 gap-3">
              {SUBJECTS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => setSubject(s.label)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-medium transition-all cursor-pointer ${
                      subject === s.label
                        ? "border-accent bg-accent-dim text-ink"
                        : "border-line bg-surface text-muted hover:border-accent/40"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-sm font-semibold text-ink">
              What did {child.name} struggle with?
            </p>
            <Textarea
              value={struggle}
              onChange={(e) => setStruggle(e.target.value)}
              placeholder='e.g. "They could not add fractions with different denominators"'
              rows={3}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStruggle(s)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/50 hover:text-ink cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 font-display text-sm font-semibold text-ink">
              How should they learn it?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                      mode === m.value
                        ? "border-accent bg-accent-dim"
                        : "border-line bg-surface hover:border-accent/40"
                    }`}
                  >
                    <Icon className="mb-1.5 block h-5 w-5 text-accent" />
                    <span className="block font-display text-sm font-bold text-ink">{m.label}</span>
                    <span className="mt-1 block text-xs leading-snug text-muted">{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-sm font-semibold text-ink">
              Anything else we should know?{" "}
              <span className="font-normal text-muted">(optional)</span>
            </p>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder='e.g. "There is a test on Thursday", "She learns best when it feels like a game"'
              rows={2}
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-accent-dim px-4 py-3 text-sm text-accent">{error}</p>
          ) : null}

          <Button
            onClick={generate}
            disabled={!subject || !struggle.trim() || generating}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
                Building {child.name}&apos;s lesson…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Build {child.name}&apos;s lesson
              </>
            )}
          </Button>
        </Card>
      </div>
    </main>
  );
}
