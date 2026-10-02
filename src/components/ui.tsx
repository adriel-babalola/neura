"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-bold tracking-tight ${className}`}>
      Neura<span className="text-accent">.</span>
    </span>
  );
}

/* ── Typography scale ──
   Hierarchy used to come from ad-hoc text sizes on each screen. These are the
   whole scale, so headings stay consistent across pages. */

export function PageTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <h1
      className={`font-display text-3xl font-extrabold leading-[1.1] tracking-tighter text-ink sm:text-4xl ${className}`}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={`font-display text-lg font-bold tracking-tight text-ink ${className}`}>{children}</h2>
  );
}

/** Body copy that sits under a heading. One notch down from the heading so the
 *  contrast between levels survives at a glance. */
export function Lead({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm leading-relaxed text-muted ${className}`}>{children}</p>;
}

/* ── Chalk divider ──
   A real rough.js stroke rather than a border, which is the one place the
   hand-drawn quality is worth the extra work. Rendered as static SVG ops so it
   costs nothing after the first paint. */
export function ChalkDivider({
  className = "",
  color = "var(--accent)",
  roughness = 1.1,
}: {
  className?: string;
  color?: string;
  roughness?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; strokeWidth: number }[]>([]);

  useEffect(() => {
    const width = hostRef.current?.clientWidth || 320;
    let cancelled = false;

    async function draw() {
      const rough = (await import("roughjs/bin/rough")).default;
      if (cancelled) return;
      const gen = rough.generator();
      const opts = { roughness, bowing: 1.2, stroke: color, strokeWidth: 1.3 };
      // Two overlapping passes at slightly different angles, the way a marker
      // looks when you go over a line twice.
      const strokes = [
        gen.line(0, 2, width, 1.5, opts),
        gen.line(3, 4.5, width - 5, 4, { ...opts, strokeWidth: 0.8 }),
      ];
      // toPaths flattens the low-level op sets into plain path data, which
      // renders directly as SVG without instantiating rough's SVG renderer.
      setPaths(
        strokes
          .flatMap((d) => gen.toPaths(d))
          .map((p) => ({ d: p.d, strokeWidth: p.strokeWidth }))
      );
    }

    // Width is unknown until layout, so recompute on resize instead of
    // stretching a fixed-size canvas.
    void draw();
    const onResize = () => void draw();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [color, roughness]);

  return (
    <div ref={hostRef} className={`w-full ${className}`} aria-hidden>
      <svg width="100%" height="6" className="block overflow-visible opacity-50">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={color} strokeWidth={p.strokeWidth} />
        ))}
      </svg>
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-control font-display font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none";
  const sizes =
    size === "sm"
      ? "min-h-9 px-3.5 text-xs"
      : size === "lg"
        ? "min-h-12 px-6 text-[15px]"
        : "min-h-11 px-4 text-sm";
  const variants = {
    primary: "bg-accent text-white hover:brightness-[1.06]",
    outline: "border border-line bg-surface text-ink hover:bg-surface2 hover:border-line",
    ghost: "text-muted hover:text-ink hover:bg-surface2",
    danger: "border border-warn/40 bg-warn/10 text-warn hover:bg-warn/15",
  };
  return (
    <button
      ref={ref}
      className={`${base} ${sizes} ${variants[variant]} ${className}`}
      style={variant === "primary" ? { boxShadow: "var(--shadow-card)" } : undefined}
      {...props}
    />
  );
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full min-h-12 rounded-control border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all ${className}`}
        {...props}
      />
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`w-full min-h-24 rounded-control border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all resize-none ${className}`}
        {...props}
      />
    );
  }
);

export function Card({
  className = "",
  children,
  interactive = false,
}: {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-line bg-surface ${interactive ? "card-hover" : ""} ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

/** Headline number with its label. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block font-display text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-relaxed text-muted">{hint}</span> : null}
    </label>
  );
}

/** Circular letter avatar. Deterministic hue per name so the same child always
 *  gets the same colour across the parent and student screens. */
export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  const hue = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
    return hash;
  }, [name]);

  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${className}`}
      style={{
        background: `hsl(${hue} 42% 92%)`,
        color: `hsl(${hue} 45% 28%)`,
      }}
    >
      {initials}
    </span>
  );
}
