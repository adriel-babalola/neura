"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, GraduationCap, Lock, UserRound } from "lucide-react";
import { useProfile } from "@/lib/profile";
import type { Role } from "@/lib/types";

const ROLES: { role: Role; title: string; subtitle: string; icon: typeof UserRound }[] = [
  {
    role: "parent",
    title: "I'm a parent",
    subtitle: "Set up lessons and watch their progress",
    icon: UserRound,
  },
  {
    role: "child",
    title: "I'm a student",
    subtitle: "Jump into my latest lesson",
    icon: GraduationCap,
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
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-canvas px-6 py-12">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-ink">
            Welcome to Neura<span className="text-accent">.</span>
          </h1>
          <p className="text-sm text-muted">
            Your child&apos;s personal AI tutor. Sign in. It takes 10 seconds.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass space-y-6 rounded-2xl border border-line p-6"
        >
          <div className="relative">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Your name (demo only)"
              className="w-full rounded-xl border border-line bg-canvas/60 py-3 pl-4 pr-11 text-[15px] text-ink placeholder:text-muted/60 backdrop-blur-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
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
                    className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                      active
                        ? "border-accent bg-accent-dim"
                        : "border-line bg-canvas/40 hover:bg-surface2"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        active ? "bg-accent text-white" : "bg-surface2 text-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-display text-sm font-bold text-ink">
                        {r.title}
                      </span>
                      <span className="block text-xs text-muted">{r.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={continueFlow}
            disabled={!canContinue}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-display text-[15px] font-medium text-canvas shadow-sm shadow-accent/25 transition-all hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {selected ? "Continue" : "Choose who you are"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted/80">
            <Lock className="h-3 w-3" />
            No password. This demo stores everything on this device.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
