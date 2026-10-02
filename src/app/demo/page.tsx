"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Play,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import AnimatedMathBoard from "@/components/AnimatedMathBoard";
import { fetchEdgeAI, measurePrompt } from "@/lib/api-client";
import { getOfflineLesson } from "@/lib/edge-fallback";
import { useLocalVoice } from "@/hooks/useLocalVoice";

const DEMO_EQUATIONS = [
  {
    label: "Pythagorean Theorem",
    content:
      "In any right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides. $$a^2 + b^2 = c^2$$ For example, a 3-4-5 triangle: $$3^2 + 4^2 = 5^2$$",
  },
  {
    label: "Mass-Energy Equivalence",
    content:
      "Einstein showed that mass and energy are two forms of the same thing. $$E = mc^2$$ Where $c \\approx 3 \\times 10^8$ m/s is the speed of light.",
  },
  {
    label: "Quadratic Formula",
    content:
      "Given a quadratic equation $ax^2 + bx + c = 0$, the solutions are: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$",
  },
];

export default function DeepTechDemoPage() {
  const [promptInput, setPromptInput] = useState(
    "Explain the Pythagorean theorem for a 10 year old who loves sports"
  );
  const [payloadInfo, setPayloadInfo] = useState("");
  const [aiOutput, setAiOutput] = useState<{
    content: string;
    equation?: string;
    status: string;
    modelUsed?: string;
    latencyMs?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [activeEquation, setActiveEquation] = useState(0);

  const {
    speak,
    stop,
    isGenerating: isVoiceGenerating,
    isPlaying: isVoicePlaying,
    error: voiceError,
  } = useLocalVoice();

  const handleMeasurePayload = () => {
    setPayloadInfo(measurePrompt(promptInput).summary);
  };

  const handleRunAI = async () => {
    setIsLoading(true);
    setPayloadInfo(measurePrompt(promptInput).summary);

    if (simulatedOffline) {
      setTimeout(() => {
        const offline = getOfflineLesson("math");
        setAiOutput({
          content: [offline.intro, offline.scenes[0].speech ?? offline.scenes[0].narrative]
            .join(" ")
            .trim(),
          status: "offline-mode",
          modelUsed: "Edge Resilience Engine (local)",
          latencyMs: 8,
        });
        setIsLoading(false);
      }, 400);
      return;
    }

    try {
      const res = await fetchEdgeAI(promptInput, { subject: "math" });
      setAiOutput({
        content: res.content,
        equation: res.equation,
        status: res.status,
        modelUsed: res.modelUsed,
        latencyMs: res.latencyMs,
      });
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const speakText =
    aiOutput?.content ||
    "The Pythagorean theorem states: in a right-angled triangle, a squared plus b squared equals c squared.";

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-canvas">
      <div className="aurora-bg" aria-hidden />

      {/* ── Nav */}
      <header className="sticky top-0 z-50 border-b border-line bg-canvas">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-display font-bold text-ink">
                Neura<span className="text-accent">.</span>
              </span>
            </Link>
            <span className="h-4 w-px bg-line" />
            <span className="flex items-center gap-1.5 rounded-full bg-accent-dim px-2.5 py-1 font-display text-xs font-bold text-accent">
              <BrainCircuit className="h-3.5 w-3.5" />
              Deep-Tech Lab
            </span>
          </div>

          <button
            onClick={() => setSimulatedOffline(!simulatedOffline)}
            className={`flex items-center gap-2 rounded-chip border px-3 py-1.5 font-display text-xs font-semibold transition-all ${
              simulatedOffline
                ? "border-warn/40 bg-warn/10 text-warn"
                : "border-line bg-surface text-muted hover:bg-surface2 hover:text-ink"
            }`}
          >
            {simulatedOffline ? (
              <WifiOff className="h-3.5 w-3.5" />
            ) : (
              <Wifi className="h-3.5 w-3.5 text-success" />
            )}
            {simulatedOffline ? "Offline Mode" : "Online"}
          </button>
        </div>
      </header>

      {/* ── Page content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24 pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Bandwidth-Optimized{" "}
            <span className="bg-gradient-to-r from-accent via-accent/80 to-accent/50 bg-clip-text text-transparent">
              Semantic Streaming Engine
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            An interactive test suite for all four deep-tech features. Test SLM
            prompt compression, offline edge resilience, animated math rendering,
            and local WebGPU voice synthesis.
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* ── Tasks 1 & 2: SLM + Edge Resilience */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="glass rounded-card border border-line p-6 card-hover"
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-accent-dim px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-widest text-accent">
                    Task 1 & 2
                  </span>
                </div>
                <h2 className="font-display text-lg font-bold text-ink">
                  SLM Failover &amp; Payload Budget
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Caps the prompt at the payload budget, then routes it through the
                  model failover chain. The provider key stays server-side. Falls back to
                  a pre-authored lesson when offline.
                </p>
              </div>
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-xs font-semibold ${
                  simulatedOffline
                    ? "bg-warn/10 text-warn"
                    : "bg-success/10 text-success"
                }`}
              >
                {simulatedOffline ? (
                  <WifiOff className="h-3 w-3" />
                ) : (
                  <Wifi className="h-3 w-3" />
                )}
                {simulatedOffline ? "Offline failover active" : "Live SLM"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block font-display text-xs font-semibold uppercase tracking-wider text-muted">
                  User Prompt
                </label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  rows={2}
                  className="w-full rounded-control border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleMeasurePayload}
                  className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-4 py-2 font-display text-sm font-medium text-ink transition-colors hover:bg-surface-hover"
                >
                  <Cpu className="h-4 w-4 text-accent" />
                  Check Payload
                </button>
                <button
                  onClick={handleRunAI}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-control bg-accent px-5 py-2 font-display text-sm font-semibold text-white shadow-sm shadow-accent/20 transition-all hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
                >
                  <Zap className="h-4 w-4 fill-white" />
                  {isLoading ? "Processing…" : "Run AI Fetch"}
                </button>
              </div>

              <AnimatePresence>
                {payloadInfo && (
                  <motion.div
                    key="payload"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-control border border-line bg-surface2 px-4 py-3"
                  >
                    <p className="mb-1 font-display text-xs font-semibold uppercase tracking-wider text-muted">
                      Payload budget
                    </p>
                    <p className="font-mono text-sm text-ink">{payloadInfo}</p>
                  </motion.div>
                )}

                {aiOutput && (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-control border border-line bg-surface px-4 py-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-display text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {aiOutput.status}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="font-mono">{aiOutput.modelUsed}</span>
                        <span className="rounded bg-surface2 px-2 py-0.5 font-mono font-semibold text-ink">
                          {aiOutput.latencyMs}ms
                        </span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-ink">{aiOutput.content}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* ── Task 3: Animated Math Board */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-card border border-line bg-surface p-6 card-hover"
          >
            <div className="mb-5 border-b border-line pb-4">
              <div className="mb-1">
                <span className="flex w-fit items-center gap-1 rounded-full bg-accent-dim px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-widest text-accent">
                  Task 3
                </span>
              </div>
              <h2 className="font-display text-lg font-bold text-ink">
                Vector-Over-Video Math Animation
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Structural JSON rendered as animated KaTeX equations via Framer
                Motion — zero video bandwidth, 100% vector.
              </p>
            </div>

            {/* Equation picker */}
            <div className="mb-4 flex flex-wrap gap-2">
              {DEMO_EQUATIONS.map((eq, i) => (
                <button
                  key={eq.label}
                  onClick={() => setActiveEquation(i)}
                  className={`rounded-chip border px-3 py-1.5 font-display text-xs font-semibold transition-all ${
                    activeEquation === i
                      ? "border-accent bg-accent-dim text-accent"
                      : "border-line bg-surface2 text-muted hover:text-ink"
                  }`}
                >
                  {eq.label}
                </button>
              ))}
              {aiOutput?.equation && (
                <button
                  onClick={() => setActiveEquation(-1)}
                  className={`rounded-chip border px-3 py-1.5 font-display text-xs font-semibold transition-all ${
                    activeEquation === -1
                      ? "border-accent bg-accent-dim text-accent"
                      : "border-line bg-surface2 text-muted hover:text-ink"
                  }`}
                >
                  AI Response
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeEquation}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedMathBoard
                  content={
                    activeEquation === -1 && aiOutput?.content
                      ? aiOutput.content
                      : DEMO_EQUATIONS[activeEquation]?.content
                  }
                  equation={
                    activeEquation === -1 ? aiOutput?.equation : undefined
                  }
                />
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* ── Task 4: Local Voice */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="glass rounded-card border border-line p-6 card-hover"
          >
            <div className="mb-5 border-b border-line pb-4">
              <div className="mb-1">
                <span className="flex w-fit items-center gap-1 rounded-full bg-accent-dim px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-widest text-accent">
                  Task 4
                </span>
              </div>
              <h2 className="font-display text-lg font-bold text-ink">
                In-Browser Text-to-Speech
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Kokoro-82M ONNX model synthesizes voice locally via WebGPU
                acceleration or WASM fallback — zero cloud cost, zero latency.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => (isVoicePlaying ? stop() : speak(speakText))}
                disabled={isVoiceGenerating}
                className={`inline-flex items-center gap-2 rounded-control px-5 py-2.5 font-display text-sm font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
                  isVoicePlaying
                    ? "bg-surface2 text-ink hover:bg-surface-hover"
                    : "bg-accent text-white shadow-accent/20 hover:brightness-[1.06]"
                }`}
              >
                {isVoicePlaying ? (
                  <>
                    <VolumeX className="h-4 w-4" /> Stop
                  </>
                ) : isVoiceGenerating ? (
                  <>
                    <Volume2 className="h-4 w-4 animate-pulse" /> Loading model…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" /> Synthesize Voice Locally
                  </>
                )}
              </button>

              {isVoicePlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-sm text-success"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Playing via local GPU
                </motion.div>
              )}

              {voiceError && (
                <p className="text-sm text-warn">{voiceError}</p>
              )}
            </div>

            <p className="mt-3 text-xs text-muted">
              Will speak: &ldquo;
              {speakText.slice(0, 100)}
              {speakText.length > 100 ? "…" : ""}&rdquo;
            </p>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
