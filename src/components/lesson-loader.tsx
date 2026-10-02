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

/** Chalk smilie, matching src/app/icon.svg. */
function ChalkSmilie() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className="h-24 w-24"
      aria-hidden
      focusable="false"
      animate={{ rotate: [-3, 3, -3] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect width="64" height="64" rx="14" fill="#1C2622" />
      <circle
        cx="32"
        cy="33"
        r="19"
        fill="none"
        stroke="#F2F0E6"
        strokeWidth="3.4"
      />
      <motion.path
        d="M22.5 30.5q3.5-5 7 0"
        fill="none"
        stroke="#F2F0E6"
        strokeWidth="3.2"
        strokeLinecap="round"
        animate={{ scaleY: [1, 1, 0.15, 1] }}
        style={{ transformOrigin: "26px 30.5px" }}
        transition={{ duration: 3.4, times: [0, 0.72, 0.82, 1], repeat: Infinity }}
      />
      <motion.path
        d="M34.5 30.5q3.5-5 7 0"
        fill="none"
        stroke="#F2F0E6"
        strokeWidth="3.2"
        strokeLinecap="round"
        animate={{ scaleY: [1, 1, 0.15, 1] }}
        style={{ transformOrigin: "38px 30.5px" }}
        transition={{
          duration: 3.4,
          times: [0, 0.75, 0.85, 1],
          repeat: Infinity,
        }}
      />
      <path
        d="M23.5 39q8.5 8.5 17 0"
        fill="none"
        stroke="#F2F0E6"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <ellipse cx="20" cy="37.5" rx="3.4" ry="2.3" fill="#F2C56B" opacity="0.5" />
      <ellipse cx="44" cy="37.5" rx="3.4" ry="2.3" fill="#F2C56B" opacity="0.5" />
    </motion.svg>
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas px-6"
    >
      <ChalkSmilie />

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
