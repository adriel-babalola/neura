import { forwardRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-bold tracking-tight ${className}`}>
      Neura<span className="text-accent">.</span>
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-display font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none";
  const sizes = size === "lg" ? "min-h-12 px-6 text-[15px]" : "min-h-11 px-4 text-sm";
  const variants = {
    primary: "bg-accent text-white hover:brightness-[1.06] shadow-sm shadow-accent/20",
    outline: "border border-line text-ink hover:bg-surface2",
    ghost: "text-muted hover:text-ink hover:bg-surface2",
  };
  return (
    <button ref={ref} className={`${base} ${sizes} ${variants[variant]} ${className}`} {...props} />
  );
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full min-h-12 rounded-xl border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all ${className}`}
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
        className={`w-full min-h-24 rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all resize-none ${className}`}
        {...props}
      />
    );
  }
);

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

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
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i <= current ? "bg-accent w-6" : "bg-line w-3"
          }`}
        />
      ))}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success";
}) {
  const variants = {
    default: "border-line bg-surface2 text-muted",
    accent: "border-accent/30 bg-accent-dim text-accent",
    success: "border-success/30 bg-success/10 text-success",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
