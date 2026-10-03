"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Rotated while a lesson is being written.
 *
 * Ordered so the reassuring lines land near the end: generation is slow enough
 * that a single static "Loading..." reads as broken, and the last stretch is
 * where people are most likely to click a second time.
 */
const STAGES = [
  "Reading what they love...",
  "Choosing a story they will follow...",
  "Rounding up the numbers...",
  "Hold tight...",
  "Almost done...",
  "Finishing touches...",
  "Rounding up...",
  "Preparing the stage...",
];

const STAGE_MS = 3400;

/** Gentle spinning chalkboard star. */
function ChalkSpinner() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-24 w-24"
      aria-hidden
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#1C2622" />
      <path
        d="M32 12.5l4 12.2 12.8 1.8-9.6 8.4 2.6 12.6-10.8-6.2-10.8 6.2 2.6-12.6-9.6-8.4 12.8-1.8z"
        fill="#F2C56B"
      />
    </svg>
  );
}

/**
 * Opaque full-screen loader for lesson generation.
 *
 * Deliberately covers the whole viewport with a solid background rather than a
 * translucent scrim: the form underneath stays visible with a dimmed spinner
 * looked like the page had stalled, and the parent can still click the button
 * again mid-request.
 */
export function LessonLoader({ childName }: { childName: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStage((n) => (n + 1) % STAGES.length),
      STAGE_MS
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-canvas px-6"
    >
      <ChalkSpinner />

      <p className="mt-8 font-display text-xl font-bold tracking-tight text-ink">
        Writing {childName}&apos;s lesson
      </p>

      <div className="mt-3 flex h-6 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="text-sm text-muted"
          >
            {STAGES[stage]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Chalk stroke that sweeps as a progress hint without faking a
          percentage, which would be a lie: the request has no progress data. */}
      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full w-1/3 rounded-full bg-accent"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <p className="mt-6 text-xs text-muted">
        Usually about a minute. You can leave this tab open.
      </p>
    </div>
  );
}
