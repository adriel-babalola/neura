"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import rough from "roughjs";
import type { BoardLine } from "@/lib/types";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

function ChalkFrame() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const rc = rough.svg(ref.current);
    const w = 900;
    const h = 480;
    const seed = 42;
    ref.current.appendChild(
      rc.rectangle(6, 6, w - 12, h - 12, {
        stroke: "#F2F0E6",
        strokeWidth: 2.5,
        roughness: 1.8,
        bowing: 2,
        fill: "rgba(242,240,230,0.03)",
        seed,
      })
    );
    ref.current.appendChild(rc.line(0, 0, w, 0, { stroke: "#F2F0E6", strokeWidth: 1.2, roughness: 2.2, bowing: 3, seed }));
    ref.current.appendChild(rc.line(0, h, w, h, { stroke: "#F2F0E6", strokeWidth: 1.2, roughness: 2.2, bowing: 3, seed }));
    ref.current.appendChild(rc.line(0, 0, 0, h, { stroke: "#F2F0E6", strokeWidth: 1.2, roughness: 2.2, bowing: 3, seed }));
    ref.current.appendChild(rc.line(w, 0, w, h, { stroke: "#F2F0E6", strokeWidth: 1.2, roughness: 2.2, bowing: 3, seed }));
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 900 480" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden data-blackboard />
  );
}

function ChalkLine({ line }: { line: BoardLine }) {
  if (line.kind === "divider") {
    return <div className="my-2 h-px w-full bg-line/40" />;
  }

  if (line.kind === "math") {
    return (
      <div className="my-2 flex justify-center">
        <InlineMath math={line.latex} />
      </div>
    );
  }

  const color = line.color ?? "text-chalk";
  return <p className={`text-[17px] leading-relaxed chalk-glow ${color}`}>{line.text}</p>;
}

export default function Blackboard({
  lines,
  onLineDone,
  autoAdvanceMs = 700,
}: {
  lines: BoardLine[];
  onLineDone?: (done: boolean) => void;
  autoAdvanceMs?: number;
}) {
  const [visible, setVisible] = useState(0);
  const total = lines.length;

  useEffect(() => {
    if (visible >= total) {
      // Hold the scene so kids can read before advancing.
      // ~60ms per character + 2s per math line, minimum 3s.
      const textLen = lines
        .filter((l) => l.kind === "text")
        .reduce((sum, l) => sum + ((l as { text: string }).text?.length ?? 0), 0);
      const mathCount = lines.filter((l) => l.kind === "math").length;
      const holdMs = Math.max(7000, textLen * 100 + mathCount * 4000);
      const t = setTimeout(() => onLineDone?.(true), holdMs);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 350 : autoAdvanceMs);
    return () => clearTimeout(t);
  }, [visible, total, lines, onLineDone, autoAdvanceMs]);

  const shown = lines.slice(0, visible);
  const hasMath = shown.some((l) => l.kind === "math");

  return (
    <div className="board-texture relative h-full w-full overflow-hidden rounded-xl bg-board">
      <ChalkFrame />
      <div className="relative z-10 flex h-full flex-col justify-start gap-2 overflow-y-auto px-10 py-8">
        {shown.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ChalkLine line={line} />
          </motion.div>
        ))}
        {!hasMath && visible < total && (
          <motion.span
            className="inline-block h-6 w-2.5 bg-chalk/60"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
