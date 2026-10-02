"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { BoardStroke, DiagramKind } from "@/lib/types";

interface AnimatedMathBoardProps {
  content?: string;
  equation?: string;
  /** Semantic draw operations emitted by the model. Preferred over `content`. */
  strokes?: BoardStroke[];
  className?: string;
  /** "board" = chalkboard dark world, "light" = parent/surface world */
  theme?: "board" | "light";
}

interface Block {
  id: number;
  text: string;
  isMath: boolean;
  isInline: boolean;
}

function parseBlocks(raw: string): Block[] {
  if (!raw) return [];
  const blocks: Block[] = [];
  let id = 0;

  const dParts = raw.split("$$");
  dParts.forEach((part, i) => {
    if (i % 2 !== 0) {
      if (part.trim())
        blocks.push({ id: id++, text: part.trim(), isMath: true, isInline: false });
      return;
    }
    const iParts = part.split("$");
    iParts.forEach((sub, j) => {
      if (j % 2 !== 0) {
        if (sub.trim())
          blocks.push({ id: id++, text: sub.trim(), isMath: true, isInline: true });
        return;
      }
      if (sub.trim())
        blocks.push({ id: id++, text: sub, isMath: false, isInline: false });
    });
  });
  return blocks;
}

function KaTeXBlock({ tex, display }: { tex: string; display: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(tex, ref.current, {
        displayMode: display,
        throwOnError: false,
        output: "html",
      });
    } catch {
      if (ref.current) ref.current.textContent = tex;
    }
  }, [tex, display]);
  return <span ref={ref} />;
}

/** Animate an SVG path as if it were being drawn in chalk. */
function DrawPath({
  d,
  delay = 0,
  strokeWidth = 2.5,
}: {
  d: string;
  delay?: number;
  strokeWidth?: number;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay, ease: "easeInOut" }}
    />
  );
}

function Label({
  x,
  y,
  children,
  delay = 0.3,
  anchor = "middle",
}: {
  x: number;
  y: number;
  children: string;
  delay?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <motion.text
      x={x}
      y={y}
      textAnchor={anchor}
      className="font-math text-[13px]"
      fill="currentColor"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.text>
  );
}

const DIAGRAM_TITLES: Record<DiagramKind, string> = {
  "right-triangle": "Right triangle",
  rectangle: "Rectangle",
  circle: "Circle",
  "number-line": "Number line",
  grid: "Grid",
};

function Diagram({
  kind,
  labels = {},
}: {
  kind: DiagramKind;
  labels?: Record<string, string>;
}) {
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const value = labels[key];
      if (value) return value;
    }
    return "";
  };

  if (kind === "right-triangle") {
    const rightAngle = get("rightAngle", "corner");
    return (
      <svg viewBox="0 0 200 150" className="h-auto w-full max-w-[300px]" role="img" aria-label={DIAGRAM_TITLES[kind]}>
        <DrawPath d="M30 125 L170 125" />
        <DrawPath d="M30 125 L30 25" delay={0.2} />
        <DrawPath d="M30 25 L170 125" delay={0.4} strokeWidth={2.5} />
        <motion.path
          d="M30 113 L42 113 L42 125"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.6 }}
        />
        <Label x={100} y={143} delay={0.5}>
          {get("b", "base")}
        </Label>
        <Label x={16} y={78} delay={0.7}>
          {get("a", "height")}
        </Label>
        <Label x={118} y={62} delay={0.9}>
          {get("c", "hypotenuse")}
        </Label>
        {rightAngle && <Label x={46} y={118} delay={1}>{rightAngle}</Label>}
      </svg>
    );
  }

  if (kind === "rectangle") {
    return (
      <svg viewBox="0 0 200 150" className="h-auto w-full max-w-[300px]" role="img" aria-label={DIAGRAM_TITLES[kind]}>
        <DrawPath d="M35 125 L165 125" />
        <DrawPath d="M165 125 L165 25" delay={0.15} />
        <DrawPath d="M165 25 L35 25" delay={0.3} />
        <DrawPath d="M35 25 L35 125" delay={0.45} />
        <Label x={100} y={143} delay={0.6}>
          {get("w", "width")}
        </Label>
        <Label x={181} y={80} delay={0.75}>
          {get("h", "height")}
        </Label>
        {get("label") && <Label x={100} y={82} delay={0.9}>{get("label")}</Label>}
      </svg>
    );
  }

  if (kind === "circle") {
    return (
      <svg viewBox="0 0 200 150" className="h-auto w-full max-w-[300px]" role="img" aria-label={DIAGRAM_TITLES[kind]}>
        <motion.circle
          cx={100}
          cy={75}
          r={50}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
        <DrawPath d="M100 75 L150 75" delay={0.5} />
        <motion.circle
          cx={100}
          cy={75}
          r={2.5}
          fill="currentColor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        />
        <Label x={125} y={68} delay={0.7}>
          {get("r", "radius")}
        </Label>
        {get("d", "diameter") && <Label x={125} y={68} delay={0.9}>{get("d")}</Label>}
      </svg>
    );
  }

  if (kind === "number-line") {
    const ticks = Array.from({ length: 11 }, (_, i) => 20 + i * 16);
    return (
      <svg viewBox="0 0 200 90" className="h-auto w-full max-w-[320px]" role="img" aria-label={DIAGRAM_TITLES[kind]}>
        <DrawPath d="M10 55 L188 55" />
        <motion.path
          d="M180 48 L188 55 L180 62"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
        {ticks.map((x, i) => (
          <motion.line
            key={x}
            x1={x}
            y1={49}
            x2={x}
            y2={61}
            stroke="currentColor"
            strokeWidth={1.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ delay: 0.25 + i * 0.04 }}
          />
        ))}
        {ticks.map((x, i) => {
          const value = labels[String(i)] ?? (i === 0 ? "0" : String(i));
          return (
            <Label key={`l${x}`} x={x} y={76} delay={0.35 + i * 0.04}>
              {value}
            </Label>
          );
        })}
      </svg>
    );
  }

  // Grid.
  // X and Y need separate extents. The previous version reused a single array
  // for both axes, so vertical lines stopped at x=160 while horizontals ran out
  // to x=190, and the y=160 row fell outside the 150-tall viewBox and was
  // clipped entirely. The result was a lopsided grid with a missing column and
  // a missing row, which is what made it read as "not accurate".
  const GRID_X = [10, 40, 70, 100, 130, 160, 190];
  const GRID_Y = [10, 40, 70, 100, 130];
  const GRID_TOP = GRID_Y[0];
  const GRID_BOTTOM = GRID_Y[GRID_Y.length - 1];
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full max-w-[300px]" role="img" aria-label={DIAGRAM_TITLES[kind]}>
      {GRID_X.map((x, i) => (
        <motion.line
          key={`v${x}`}
          x1={x}
          y1={GRID_TOP}
          x2={x}
          y2={GRID_BOTTOM}
          stroke="currentColor"
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 0.04 * i }}
        />
      ))}
      {GRID_Y.map((y, i) => (
        <motion.line
          key={`h${y}`}
          x1={GRID_X[0]}
          y1={y}
          x2={GRID_X[GRID_X.length - 1]}
          y2={y}
          stroke="currentColor"
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 0.04 * i }}
        />
      ))}
      {get("label") && <Label x={100} y={75} delay={0.6}>{get("label")}</Label>}
    </svg>
  );
}

/** Callouts in the light parent/surface world. */
const CALLOUT_STYLES = {
  hint: "border-accent/40 bg-accent-dim text-accent",
  warning: "border-warning/40 bg-warning/10 text-warning",
  success: "border-success/40 bg-success/10 text-success",
} as const;

/**
 * Callouts on the chalkboard.
 *
 * These cannot reuse the semantic tokens. The board is dark in both light and
 * dark page themes, but --success and --warning still resolve from the page
 * theme, so a success callout painted #3F7350 dark green onto the #1C2622
 * board: roughly 2:1 and effectively invisible. These are the board's own
 * palette, all above 7:1 against the board.
 */
const CALLOUT_STYLES_BOARD = {
  hint: "border-[#F2C56B]/45 bg-[#F2C56B]/12 text-[#F2C56B]",
  warning: "border-[#F0A6A6]/45 bg-[#F0A6A6]/12 text-[#F0A6A6]",
  success: "border-[#A9D4B4]/45 bg-[#A9D4B4]/12 text-[#A9D4B4]",
} as const;

export default function AnimatedMathBoard({
  strokes,
  content,
  equation,
  className = "",
  theme = "board",
}: AnimatedMathBoardProps) {
  const isBoard = theme === "board";
  const hasStrokes = Array.isArray(strokes) && strokes.length > 0;

  const fallbackRaw = useMemo(() => {
    if (content) return content;
    if (equation) return `$$${equation}$$`;
    return "";
  }, [content, equation]);

  const blocks = useMemo(
    () => (hasStrokes ? [] : parseBlocks(fallbackRaw)),
    [hasStrokes, fallbackRaw]
  );

  if (!hasStrokes && blocks.length === 0) return null;

  const panel = `flex flex-col items-center gap-2 rounded-card border px-6 py-5 shadow-lg ${
    isBoard ? "border-chalk/10 bg-chalk/5" : "border-line bg-surface shadow-sm"
  }`;
  const textClass = isBoard ? "text-chalk" : "text-ink";

  return (
    <div className={className}>
      {hasStrokes
        ? strokes!.map((stroke, index) => {
            const delay = index * 0.25;

            if (stroke.kind === "equation") {
              const emphasis = stroke.emphasis ?? "none";
              return (
                <motion.div
                  key={`eq-${index}`}
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
                  className={`${panel} my-5 ${
                    emphasis === "highlight"
                      ? isBoard
                        ? "bg-accent-dim ring-1 ring-accent/40"
                        : "bg-accent-dim"
                      : emphasis === "box"
                        ? isBoard
                          ? "ring-2 ring-accent/50 ring-offset-2 ring-offset-transparent"
                          : "ring-2 ring-accent/50"
                        : ""
                  }`}
                >
                  <div className={`font-math text-xl sm:text-2xl md:text-3xl ${textClass}`}>
                    <KaTeXBlock tex={stroke.tex} display={true} />
                  </div>
                  {stroke.note && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: delay + 0.3 }}
                      className={`text-center text-sm ${isBoard ? "text-chalk-dim" : "text-muted"}`}
                    >
                      {stroke.note}
                    </motion.p>
                  )}
                </motion.div>
              );
            }

            if (stroke.kind === "diagram") {
              return (
                <motion.div
                  key={`dg-${index}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay }}
                  className={`${panel} ${textClass}`}
                >
                  <p
                    className={`self-start font-display text-[11px] uppercase tracking-widest ${
                      isBoard ? "text-chalk-dim" : "text-muted"
                    }`}
                  >
                    {DIAGRAM_TITLES[stroke.diagram]}
                  </p>
                  <Diagram kind={stroke.diagram} labels={stroke.labels} />
                  {stroke.note && (
                    <p
                      className={`text-center text-sm ${
                        isBoard ? "text-chalk-dim" : "text-muted"
                      }`}
                    >
                      {stroke.note}
                    </p>
                  )}
                </motion.div>
              );
            }

            return (
              <motion.div
                key={`co-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay }}
                className={`my-3 rounded-control border px-4 py-3 text-sm font-medium ${
                  isBoard
                    ? CALLOUT_STYLES_BOARD[stroke.tone ?? "hint"]
                    : CALLOUT_STYLES[stroke.tone ?? "hint"]
                }`}
              >
                {stroke.text}
              </motion.div>
            );
          })
        : blocks.map((block) => {
            if (!block.isMath) return null;

            if (block.isInline) {
              return (
                <motion.span
                  key={block.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: block.id * 0.1, ease: "easeOut" }}
                  className={`mx-1 inline-block rounded border px-2 py-0.5 font-mono text-base ${
                    isBoard
                      ? "border-chalk-b/20 bg-chalk-b/10 text-chalk-b"
                      : "border-accent/20 bg-accent-dim text-accent"
                  }`}
                >
                  <KaTeXBlock tex={block.text} display={false} />
                </motion.span>
              );
            }

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.55, delay: block.id * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`${panel} my-5 ${textClass}`}
              >
                <div className="font-math text-xl sm:text-2xl md:text-3xl">
                  <KaTeXBlock tex={block.text} display={true} />
                </div>
              </motion.div>
            );
          })}
    </div>
  );
}