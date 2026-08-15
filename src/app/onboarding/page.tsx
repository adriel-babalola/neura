"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Anchor,
  ArrowLeft,
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
import { Button, Card, Field, Input, Logo, StepProgress, Textarea } from "@/components/ui";
import type { LearningStyle, Profile } from "@/lib/types";

const STYLE_OPTIONS: { value: LearningStyle; label: string; icon: typeof Eye }[] = [
  { value: "visual", label: "Sees it", icon: Eye },
  { value: "auditory", label: "Hears it", icon: Ear },
  { value: "kinesthetic", label: "Touches & tries", icon: Hand },
  { value: "social", label: "Learns with friends", icon: Users },
  { value: "independent", label: "Figuring it out alone", icon: Compass },
];

const INTEREST_OPTIONS: { label: string; icon: typeof Rocket }[] = [
  { label: "Superheroes", icon: Sparkles },
  { label: "Dinosaurs", icon: PawPrint },
  { label: "Sports", icon: Trophy },
  { label: "Space", icon: Rocket },
  { label: "Animals", icon: PawPrint },
  { label: "Games", icon: Gamepad2 },
  { label: "Pirates", icon: Anchor },
  { label: "Art", icon: Palette },
];

const FRUSTRATION_OPTIONS: { label: string; icon: typeof CloudOff }[] = [
  { label: "Gets stuck and gives up quickly", icon: CloudOff },
  { label: "Works hard but loses focus", icon: Focus },
  { label: "Feels anxious about wrong answers", icon: HeartCrack },
  { label: "Goes too fast and makes careless errors", icon: Zap },
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
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-canvas px-6 py-10">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 w-full max-w-xl space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={back}
            className="flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {step === 0 ? "Start over" : "Back"}
          </button>
          <Logo />
          <StepProgress current={step} total={total} />
        </div>

        {step === 0 && (
          <Card className="fade-step space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-ink">About the grown-up</h1>
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
            </Button>
          </Card>
        )}

        {step === 1 && (
          <Card className="fade-step space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-ink">Meet the student</h1>
              <p className="text-sm text-muted">
                This shapes how Neura speaks, so a 7-year-old and a 12-year-old get
                very different lessons.
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
            <Button onClick={next} disabled={!canContinue()} size="lg" className="w-full">
              Continue
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="fade-step space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-ink">
                What lights up {childName || "their"} imagination?
              </h1>
              <p className="text-sm text-muted">
                Neura weaves their favorite things into every lesson so learning feels like play.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {INTEREST_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = interest === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setInterest(opt.label)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all cursor-pointer ${
                      active
                        ? "border-accent bg-accent-dim text-ink"
                        : "border-line bg-surface text-muted hover:border-accent/40"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-accent" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <Field label="Or type their own">
              <Input
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="e.g. Minecraft, ballet, dragons…"
              />
            </Field>

            <div className="space-y-3">
              <p className="font-display text-sm font-semibold text-ink">How do they learn best?</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                        style === s.value
                          ? "border-accent bg-accent-dim text-ink"
                          : "border-line text-muted hover:border-accent/40"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-accent" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button onClick={next} disabled={!canContinue()} size="lg" className="w-full">
              Continue
            </Button>
          </Card>
        )}

        {step === 3 && (
          <Card className="fade-step space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-ink">When learning gets hard</h1>
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
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all cursor-pointer ${
                      active
                        ? "border-accent bg-accent-dim text-ink"
                        : "border-line bg-surface text-muted hover:border-accent/40"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-accent" />
                    {opt.label}
                  </button>
                );
              })}
              <Textarea
                value={frustration}
                onChange={(e) => setFrustration(e.target.value)}
                placeholder="Or tell us in your own words…"
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" size="lg" className="flex-1">
                Back
              </Button>
              <Button onClick={finish} size="lg" className="flex-[2]">
                Create {childName || "their"} profile →
              </Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
