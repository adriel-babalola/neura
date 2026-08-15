"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Lock,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useProfile } from "@/lib/profile";
import type { Role } from "@/lib/types";

const ROLES: { role: Role; title: string; subtitle: string; icon: typeof UserRound; emoji: string }[] = [
  {
    role: "parent",
    title: "I'm a parent",
    subtitle: "Set up lessons and track progress",
    icon: UserRound,
    emoji: "👨‍👩‍👧",
  },
  {
    role: "child",
    title: "I'm a student",
    subtitle: "Jump into my latest lesson",
    icon: GraduationCap,
    emoji: "🎓",
  },
];

export default function SignInPage() {
  const router = useRouter();
  const { setRole, profile } = useProfile();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Role | null>(null);

  const canContinue = !!selected;

  const continueFlow = () => {
    if (!selected) return;
    setRole(selected);
    if (profile?.onboarded) {
      router.push(selected === "parent" ? "/parent" : "/child/latest");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6 py-12">
      <div className="aurora-bg" aria-hidden />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface2">
              <Sparkles className="h-7 w-7 text-accent" />
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tighter text-ink sm:text-4xl">
              Welcome to Neura<span className="text-accent">.</span>
            </h1>
            <p className="mt-2 text-sm text-muted">
              Your child&apos;s personal AI tutor. Pick your role to get started.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-sm"
        >
          <div className="relative">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Your name (demo only)"
              className="w-full rounded-xl border border-line bg-surface2 py-3.5 pl-4 pr-11 text-[15px] text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all"
            />
            <UserRound className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
          </div>

          <div className="space-y-2">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-muted">
              Who&apos;s signing in?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = selected === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => setSelected(r.role)}
                    className={`flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all cursor-pointer ${
                      active
                        ? "border-accent bg-accent-dim shadow-sm"
                        : "border-line bg-surface2 hover:border-accent/40 hover:bg-surface-hover"
                    }`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        active ? "bg-accent text-white" : "bg-canvas text-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-display text-sm font-bold text-ink">
                        {r.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">{r.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={continueFlow}
            disabled={!canContinue}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-display text-[15px] font-medium text-white shadow-sm shadow-accent/25 transition-all hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {selected ? "Continue" : "Choose who you are"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-4 text-[11px] text-muted/80">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              No password needed
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Data stays on device
            </span>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
