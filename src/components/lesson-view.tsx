"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  LayoutDashboard,
  MessageCircleQuestion,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import confetti from "canvas-confetti";
import Blackboard from "@/components/blackboard";
import ChalkDust from "@/components/chalk-dust";
import type { BoardLine, Lesson, Question } from "@/lib/types";
import { hasLocalVoice, prewarm, say, stopSay } from "@/lib/say";
import {
  isSpeechEnabled,
  onVoicesChanged,
  setSpeechEnabled,
  speechStatus,
  unlockSpeech,
} from "@/lib/speech";

type Status = "idle" | "correct" | "wrong" | "revealed";

const CONFETTI_COLORS = ["#F2C56B", "#F0A6A6", "#9CC5E8", "#A9D4B4", "#F2F0E6"];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isAccepted(q: Question, input: string) {
  const n = normalize(input);
  if (!n) return false;
  if (normalize(q.answer) && n.includes(normalize(q.answer))) return true;
  return q.accept.some((a) => normalize(a).length > 2 && n.includes(normalize(a)));
}

function celebrate() {
  confetti({
    particleCount: 70,
    spread: 75,
    startVelocity: 32,
    origin: { y: 0.7 },
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
  });
}

function QuestionPanel({
  q,
  index,
  total,
  onSolved,
  onWrong,
  onReplay,
}: {
  q: Question;
  index: number;
  total: number;
  onSolved: (qId: string) => void;
  onWrong: (attempt: number) => void;
  onReplay: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [input, setInput] = useState("");

  const submit = () => {
    if (!input.trim()) return;
    if (isAccepted(q, input)) {
      setStatus("correct");
      setTimeout(() => onSolved(q.id), 1600);
    } else if (attempt === 0) {
      setStatus("wrong");
      setAttempt(1);
      onWrong(0);
    } else {
      setStatus("revealed");
      onWrong(1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="question-alert flex flex-col gap-4 rounded-2xl border border-accent/40 bg-surface p-5 shadow-[0_0_0_1px_rgba(242,197,107,0.15),0_8px_30px_-8px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-accent-dim px-2.5 py-1 font-display text-xs font-bold text-accent">
          <MessageCircleQuestion className="h-3.5 w-3.5" />
          Question {index + 1} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onReplay}
            title="Hear it again"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-dim hover:text-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] text-muted">No timer</span>
        </div>
      </div>

      <p className="font-display text-[17px] font-semibold leading-snug text-ink">{q.prompt}</p>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Your answer…"
          className="min-h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
          autoFocus
        />
        <button
          onClick={submit}
          disabled={!input.trim() || status === "correct"}
          className="min-h-11 cursor-pointer rounded-xl bg-accent px-4 font-display text-sm font-medium text-canvas transition-all active:scale-95 disabled:opacity-40"
        >
          Try
        </button>
      </div>

      <AnimatePresence mode="wait">
        {status === "wrong" && (
          <motion.div
            key="w1"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-accent-dim px-4 py-3 text-sm text-ink"
          >
            <span className="font-display font-semibold">Not quite, and that&apos;s okay. </span>
            {q.hint}
          </motion.div>
        )}
        {status === "revealed" && (
          <motion.div
            key="w2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-accent-dim px-4 py-3 text-sm text-ink"
          >
            <span className="font-display font-semibold">Here&apos;s a clue: </span>
            {q.deeperHint}
          </motion.div>
        )}
        {status === "correct" && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-success/15 px-4 py-3 text-sm text-success"
          >
            <span className="font-display font-semibold">You got it!</span> That&apos;s the reasoning,
            and the board continues.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StoryPage({ lines, onDone }: { lines: BoardLine[]; onDone: () => void }) {
  const textLines = lines.filter((l) => l.kind === "text");
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= textLines.length) {
      const t = setTimeout(onDone, 2800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 1400);
    return () => clearTimeout(t);
  }, [visible, textLines.length, onDone]);

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-6 py-8 md:px-10">
      <div className="max-w-2xl space-y-5">
        {textLines.slice(0, visible).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display text-[19px] leading-8 text-chalk"
          >
            {line.text}
          </motion.p>
        ))}
        {visible < textLines.length && (
          <motion.span
            className="inline-block h-5 w-2 bg-chalk/60"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

export default function LessonView({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [soundOn, setSoundOn] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState<"ok" | "no-voices" | "unsupported">("ok");
  const [voiceOffline, setVoiceOffline] = useState(false);
  const announcedRef = useRef<string | null>(null);
  const lastSolvedSpeakRef = useRef(0);
  const narratedRef = useRef<number | null>(null);
  const firstSceneRef = useRef(true);
  const prewarmedRef = useRef(false);

  const currentScene = lesson.scenes[Math.min(sceneIndex, lesson.scenes.length - 1)];

  const sceneLines = useMemo(
    () =>
      currentScene?.lines?.length
        ? currentScene.lines
        : [{ kind: "text" as const, text: "The chalkboard is getting ready…" }],
    [currentScene]
  );

  const questions = useMemo(
    () => [...lesson.questions].sort((a, b) => a.sceneIndex - b.sceneIndex),
    [lesson.questions]
  );

  const pendingQuestion = useMemo(
    () => questions.find((q) => q.sceneIndex === sceneIndex && !solvedIds.has(q.id)),
    [questions, sceneIndex, solvedIds]
  );

  const isPaused = !!pendingQuestion;

  const onLineDone = useCallback(() => {
    if (isPaused) return;
    if (sceneIndex >= lesson.scenes.length - 1) return;
    setSceneIndex((s) => s + 1);
  }, [isPaused, sceneIndex, lesson.scenes.length]);

  const onSolved = useCallback(
    (qId: string) => {
      const nextSolved = new Set(solvedIds).add(qId);
      setSolvedIds(nextSolved);
      const remainingAtScene = questions.filter(
        (q) => q.sceneIndex === sceneIndex && !nextSolved.has(q.id)
      );
      if (remainingAtScene.length === 0) {
        setTimeout(() => {
          setSceneIndex((s) => Math.min(s + 1, lesson.scenes.length - 1));
        }, 800);
      }
    },
    [solvedIds, questions, sceneIndex, lesson.scenes.length]
  );

  const progress =
    ((sceneIndex + (isPaused ? 0 : 1)) / Math.max(lesson.scenes.length, 1)) * 100;

  const finished = sceneIndex >= lesson.scenes.length - 1;

  const speakPrompt = useCallback((q: Question, signal = true) => {
    if (!isSpeechEnabled()) return;
    if (signal) say(`Here is a question for you. ${q.prompt}`);
    else say(q.prompt);
  }, []);

  useEffect(() => {
    const unlock = () => unlockSpeech();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const update = () => setVoiceStatus(speechStatus());
    update();
    return onVoicesChanged(update);
  }, []);

  useEffect(() => {
    // No remote voice system — voice offline indicator not needed
    setVoiceOffline(false);
  }, []);

  useEffect(() => {
    if (!soundOn || !lesson.intro) return;
    if (!hasLocalVoice()) return;
    const t = setTimeout(() => say(lesson.intro), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!soundOn || prewarmedRef.current) return;
    prewarmedRef.current = true;
    const texts: string[] = [];
    const s = lesson.scenes[0];
    if (s) {
      const t = (s.lines ?? [])
        .filter((l) => l.kind === "text" && l.text)
        .map((l) => (l as Extract<BoardLine, { kind: "text" }>).text)
        .join(". ")
        .slice(0, 400);
      if (t.trim()) texts.push(t);
    }
    prewarm(texts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!soundOn || !sceneLines) return;
    if (narratedRef.current === sceneIndex) return;
    narratedRef.current = sceneIndex;
    const isFirst = firstSceneRef.current;
    firstSceneRef.current = false;
    const t = setTimeout(() => {
      const text = sceneLines
        .filter((l) => l.kind === "text" && l.text)
        .map((l) => (l as Extract<BoardLine, { kind: "text" }>).text)
        .join(". ")
        .slice(0, 400);
      if (text.trim()) say(text);
    }, isFirst ? 1400 : 250);
    return () => clearTimeout(t);
  }, [sceneIndex, sceneLines, soundOn]);

  useEffect(() => {
    if (pendingQuestion && announcedRef.current !== pendingQuestion.id) {
      announcedRef.current = pendingQuestion.id;
      speakPrompt(pendingQuestion, true);
    }
  }, [pendingQuestion, speakPrompt]);

  const handleSolved = useCallback(
    (qId: string) => {
      const q = questions.find((x) => x.id === qId);
      if (q) {
        celebrate();
        say("Yes! You got it. Great thinking.");
      }
      onSolved(qId);
    },
    [questions, onSolved]
  );

  const handleWrong = useCallback(
    (attempt: number) => {
      const q = pendingQuestion;
      if (!q) return;
      const now = Date.now();
      if (now - lastSolvedSpeakRef.current < 1200) return;
      if (attempt === 0) say(`Not quite. Here is a hint: ${q.hint}`);
      else say(`Try this: ${q.deeperHint}`);
    },
    [pendingQuestion]
  );

  const toggleSound = () => {
    unlockSpeech();
    const next = !soundOn;
    setSoundOn(next);
    setSpeechEnabled(next);
    if (!next) stopSay();
  };

  const solvedCount = questions.filter((q) => q.sceneIndex < sceneIndex).length;

  return (
    <div className="flex h-[100dvh] flex-col bg-board">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line/30 bg-board px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-display text-[15px] font-bold tracking-tight text-chalk">
            Neura<span className="text-accent">.</span>
          </span>
          <div className="h-5 w-px bg-line/30" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-bold text-chalk">{lesson.title}</p>
            <p className="truncate text-[11px] text-chalk-dim">
              {lesson.subject} · {lesson.focus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-[11px] font-medium text-chalk-dim">
              Scene {Math.min(sceneIndex + 1, lesson.scenes.length)}/{lesson.scenes.length}
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line/30">
              <div
                className="progress-fill h-full rounded-full bg-accent"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={toggleSound}
            title={soundOn ? "Turn off voice" : "Turn on voice"}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors ${
              soundOn
                ? "border-accent/40 bg-accent-dim text-accent"
                : "border-line/40 text-chalk-dim hover:text-chalk"
            }`}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {voiceStatus !== "ok" && (
            <span
              className="hidden items-center gap-1 text-[10px] text-chalk-dim lg:flex"
              title="No system speech voice installed — using the cloud voice instead"
            >
              <Volume2 className="h-3 w-3" />
              Cloud voice
            </span>
          )}
          {voiceOffline && voiceStatus !== "ok" && (
            <span
              className="hidden items-center gap-1 text-[10px] font-medium text-warn lg:flex"
              title="Cloud voice temporarily unavailable — the story still plays on screen"
            >
              Voice unavailable
            </span>
          )}
          <button
            onClick={() => router.push("/parent")}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line/40 px-3 py-2 text-xs text-chalk-dim transition-colors hover:text-chalk"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Parent view
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_auto] md:grid-cols-[1fr_350px] md:grid-rows-[1fr]">
        <div className="relative min-h-0 overflow-hidden">
          <div className="board-texture absolute inset-0 bg-board" />
          <ChalkDust />
          <div className="relative h-full p-4 md:p-6">
            {lesson.mode === "story" ? (
              <StoryPage key={sceneIndex} lines={sceneLines} onDone={onLineDone} />
            ) : (
              <Blackboard
                key={sceneIndex}
                lines={sceneLines}
                onLineDone={onLineDone}
                autoAdvanceMs={sceneIndex === 0 ? 1800 : 1400}
              />
            )}
          </div>
          <AnimatePresence>
            {finished && !isPaused && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 bottom-5 z-10 flex justify-center"
              >
                <div className="mx-4 rounded-2xl border border-accent/30 bg-surface/95 px-6 py-4 text-center shadow-xl">
                  <p className="font-display text-lg font-bold text-chalk">{lesson.reflection}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="flex max-h-[40vh] min-h-0 flex-col gap-3 overflow-y-auto border-t border-line/30 bg-board p-4 md:max-h-none md:border-l md:border-t-0 md:p-5">
          <p className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest text-chalk-dim">
            {isPaused ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Your turn
              </>
            ) : (
              <>
                <HelpCircle className="h-3.5 w-3.5" />
                Questions ahead
              </>
            )}
          </p>

          <AnimatePresence mode="wait">
            {isPaused && pendingQuestion ? (
              <motion.div
                key={pendingQuestion.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <QuestionPanel
                  q={pendingQuestion}
                  index={questions.findIndex((x) => x.id === pendingQuestion.id)}
                  total={questions.length}
                  onSolved={handleSolved}
                  onWrong={handleWrong}
                  onReplay={() => speakPrompt(pendingQuestion, false)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="next"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {questions
                  .filter((q) => q.sceneIndex > sceneIndex)
                  .slice(0, 2)
                  .map((q) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-surface2 px-4 py-3 text-sm text-muted"
                    >
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{q.prompt}</span>
                    </div>
                  ))}
                {solvedCount > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {solvedCount} question{solvedCount === 1 ? "" : "s"} solved so far
                  </div>
                )}
                {solvedCount === 0 && questions.length === 0 && (
                  <div className="rounded-xl border border-line/60 bg-surface2 px-4 py-3 text-sm text-muted">
                    <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
                    Keep reading, the board is telling a story.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
