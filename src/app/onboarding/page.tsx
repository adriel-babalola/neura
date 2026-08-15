"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CloudOff,
  Compass,
  Ear,
  Eye,
  Focus,
  Gamepad2,
  Hand,
  HeartCrack,
  PawPrint,
  Palette,
  Rocket,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useProfile } from "@/lib/profile";
import { useMounted } from "@/lib/use-mounted";
import { Button, Card, Field, Input, Logo, Textarea } from "@/components/ui";
import type { LearningStyle, Profile } from "@/lib/types";

const STYLE_OPTIONS: { value: LearningStyle; label: string; icon: typeof Eye; desc: string }[] = [
  { value: "visual", label: "Sees it", icon: Eye, desc: "Pictures & diagrams" },
  { value: "auditory", label: "Hears it", icon: Ear, desc: "Listening & talking" },
  { value: "kinesthetic", label: "Touches & tries", icon: Hand, desc: "Hands-on activities" },
  { value: "social", label: "With friends", icon: Users, desc: "Group learning" },
  { value: "independent", label: "Alone", icon: Compass, desc: "Self-paced" },
];

const INTEREST_OPTIONS: { label: string; icon: typeof Rocket; emoji: string }[] = [
  { label: "Superheroes", icon: Sparkles, emoji: "🦸" },
  { label: "Dinosaurs", icon: PawPrint, emoji: "🦕" },
  { label: "Sports", icon: Trophy, emoji: "⚽" },
  { label: "Space", icon: Rocket, emoji: "🚀" },
  { label: "Animals", icon: PawPrint, emoji: "🐾" },
  { label: "Games", icon: Gamepad2, emoji: "🎮" },
  { label: "Pirates", icon: Anchor, emoji: "🏴‍☠️" },
  { label: "Art", icon: Palette, emoji: "🎨" },
];

const FRUSTRATION_OPTIONS: { label: string; icon: typeof CloudOff; desc: string }[] = [
  { label: "Gets stuck and gives up quickly", icon: CloudOff, desc: "Quits early" },
  { label: "Works hard but loses focus", icon: Focus, desc: "Gets distracted" },
  { label: "Feels anxious about wrong answers", icon: HeartCrack, desc: "Fear of mistakes" },
  { label: "Goes too fast and makes careless errors", icon: Zap, desc: "Rushes through" },
];

const STEP_INFO = [
  { title: "Parent Info", subtitle: "Tell us about yourself" },
  { title: "Meet the Student", subtitle: "Basic details about your child" },
  { title: "Learning Style", subtitle: "How do they learn best?" },
  { title: "Challenges", subtitle: "When things get hard" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, saveProfile, reset } = useProfile();
  const mounted = useMounted();

  const [step, setStep] = useState(0);
  const [parentName, setParentName] = useState(profile?.parent.name ?? "");
  const [relation, setRelation] = useState(profile?.parent.relation ?? "");
  const [childName, setChildName] = useState(profile?.child.name ?? "");
  const [age, setAge] = useState(profile?.child.age ?? 9);
  const [interest, setInterest] = useState(profile?.child.interest ?? "");
  const [style, setStyle] = useState<LearningStyle>(profile?.child.learningStyle ?? "visual");
  const [frustration, setFrustration] = useState(profile?.child.frustration ?? "");

  const total = 4;

  const next = () => {
    if (step < total - 1) setStep((s) => s + 1);
    else finish();
  };

  const back = () => {
    if (step === 0) {
      reset();
      router.push("/");
    } else setStep((s) => s - 1);
  };

  const finish = () => {
    const role = profile?.role ?? "parent";
    const p: Profile = {
      role,
      parent: { name: parentName || "Parent", relation: relation || "Parent/Guardian" },
      child: {
        name: childName || "Buddy",
        age,
        interest: interest || "Superheroes",
        learningStyle: style,
        frustration,
      },
      onboarded: true,
    };
    saveProfile(p);
    router.push(role === "parent" ? "/parent" : "/child/latest");
  };

  const canContinue = () => {
    switch (step) {
      case 0:
        return parentName.trim().length > 0;
      case 1:
        return childName.trim().length > 0 && age >= 6 && age <= 13;
      case 2:
        return interest.trim().length > 0 && style !== null;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (!mounted) return null;

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-canvas px-6 py-8 lg:py-12">
      <div className="aurora-bg" aria-hidden />

      <div className="relative z-10 w-full max-w-2xl space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={back}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {step === 0 ? "Start over" : "Back"}
          </button>
          <Logo />
          <span className="text-xs font-medium text-muted">
            {step + 1} of {total}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full rounded-full bg-accent"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="font-display text-xs font-semibold text-accent">
              {STEP_INFO[step].title}
            </p>
            <p className="text-xs text-muted">{STEP_INFO[step].subtitle}</p>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="space-y-6 p-8">
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-ink lg:text-3xl">
                    About the grown-up
                  </h1>
                  <p className="text-sm text-muted">
                    Neura talks to parents in plain language, and to kids in their own.
                    Let&apos;s set up who&apos;s in charge.
                  </p>
                </div>
                <Field label="Your name">
                  <Input
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Ama"
                    autoFocus
                  />
                </Field>
                <Field label="Your relationship to the child">
                  <Input
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="e.g. Mom, Dad, Guardian"
                  />
                </Field>
                <Button onClick={next} disabled={!canContinue()} size="lg" className="w-full">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="space-y-6 p-8">
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-ink lg:text-3xl">
                    Meet the student
                  </h1>
                  <p className="text-sm text-muted">
                    This shapes how Neura speaks — a 7-year-old and a 12-year-old get very
                    different lessons.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Child's first name">
                    <Input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="e.g. Zara"
                      autoFocus
                    />
                  </Field>
                  <Field label="Age">
                    <Input
                      type="number"
                      min={6}
                      max={13}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                    />
                  </Field>
                </div>

                {/* Age visual indicator */}
                <div className="flex items-center gap-2 rounded-xl bg-surface2 p-3">
                  <span className="text-sm">
                    {age <= 7 ? "👶" : age <= 9 ? "🧒" : age <= 11 ? "🧑" : "🧑‍🎓"}
                  </span>
                  <span className="text-xs text-muted">
                    {age <= 7
                      ? "Early learner — simple language, lots of visuals"
                      : age <= 9
                      ? "Growing reader — balanced mix of text and fun"
                      : age <= 11
                      ? "Confident student — more complex reasoning"
                      : "Pre-teen — challenging material, less hand-holding"}
                  </span>
                </div>

                <Button onClick={next} disabled={!canContinue()} size="lg" className="w-full">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="space-y-6 p-8">
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-ink lg:text-3xl">
                    What lights up {childName || "their"} imagination?
                  </h1>
                  <p className="text-sm text-muted">
                    Neura weaves their favorite things into every lesson so learning feels like
                    play.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {INTEREST_OPTIONS.map((opt) => {
                    const active = interest === opt.label;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setInterest(opt.label)}
                        className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center text-sm font-medium transition-all cursor-pointer ${
                          active
                            ? "border-accent bg-accent-dim text-ink shadow-sm"
                            : "border-line bg-surface2 text-muted hover:border-accent/40"
                        }`}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <Field label="Or type their own">
                  <Input
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    placeholder="e.g. Minecraft, ballet, dragons..."
                  />
                </Field>

                <div className="space-y-3">
                  <p className="font-display text-sm font-semibold text-ink">
                    How do they learn best?
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {STYLE_OPTIONS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.value}
                          onClick={() => setStyle(s.value)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all cursor-pointer ${
                            style === s.value
                              ? "border-accent bg-accent-dim text-ink"
                              : "border-line text-muted hover:border-accent/40"
                          }`}
                        >
                          <Icon className="h-5 w-5 text-accent" />
                          <span className="text-xs font-medium">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={next} disabled={!canContinue()} size="lg" className="w-full">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="space-y-6 p-8">
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-ink lg:text-3xl">
                    When learning gets hard
                  </h1>
                  <p className="text-sm text-muted">
                    Neura uses this to catch frustration early, before your child gives up.
                  </p>
                </div>
                <div className="space-y-3">
                  {FRUSTRATION_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = frustration === opt.label;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setFrustration(opt.label)}
                        className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all cursor-pointer ${
                          active
                            ? "border-accent bg-accent-dim text-ink shadow-sm"
                            : "border-line bg-surface text-muted hover:border-accent/40 hover:bg-surface-hover"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            active ? "bg-accent/15 text-accent" : "bg-surface2 text-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <span className="block text-sm font-medium">{opt.label}</span>
                          <span className="block text-xs text-muted">{opt.desc}</span>
                        </div>
                        {active && (
                          <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-accent" />
                        )}
                      </button>
                    );
                  })}
                  <Textarea
                    value={frustration}
                    onChange={(e) => setFrustration(e.target.value)}
                    placeholder="Or tell us in your own words..."
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setStep(2)} variant="outline" size="lg" className="flex-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={finish} size="lg" className="flex-[2]">
                    <Sparkles className="h-4 w-4" />
                    Create {childName || "their"} profile
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completed steps summary */}
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2"
          >
            {step >= 1 && parentName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {parentName}
              </span>
            )}
            {step >= 2 && childName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {childName}, {age}
              </span>
            )}
            {step >= 3 && interest && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Loves {interest}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
