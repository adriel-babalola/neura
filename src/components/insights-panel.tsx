"use client";

import {
  Award,
  Brain,
  Compass,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import type { ProgressStats } from "@/lib/history";

/* Icons carry the tone here instead of coloured backgrounds. Every attempt at a
   palette-coded version pulled in emerald/amber/purple chips that fought the
   warm paper palette, and the icons alone read fine. */
type Tone = "accent" | "success" | "warn";

function InsightCard({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
  tone: Tone;
}) {
  const tones: Record<Tone, string> = {
    accent: "bg-accent-dim text-accent",
    success: "bg-success/10 text-success",
    warn: "bg-warn/10 text-warn",
  };

  return (
    <div className="flex gap-3.5 rounded-card border border-line bg-surface p-4 card-hover">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-chip ${tones[tone]}`}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold tracking-tight text-ink">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}

type Insight = {
  icon: typeof Brain;
  title: string;
  description: string;
  tone: Tone;
};

function buildInsights(stats: ProgressStats, childName: string): Insight[] {
  const insights: Insight[] = [];

  if (stats.totalLessons === 0) {
    insights.push({
      icon: Lightbulb,
      title: "Ready to start",
      description: `Create ${childName}'s first lesson to see progress insights here.`,
      tone: "accent",
    });
    return insights;
  }

  // First-try accuracy, not final accuracy. Counting a question as correct
  // after the child was handed a hint flattered the number and disagreed with
  // what the dashboard reports.
  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.firstTryCorrect / stats.totalQuestions) * 100)
      : 0;

  if (accuracy >= 80) {
    insights.push({
      icon: Award,
      title: "Strong understanding",
      description: `${childName} answers ${accuracy}% of questions right without a hint. The foundations are solid.`,
      tone: "success",
    });
  } else if (accuracy >= 50) {
    insights.push({
      icon: TrendingUp,
      title: "Getting there",
      description: `${accuracy}% first-try accuracy. Shorter lessons on the trickier parts usually close the remaining gap.`,
      tone: "accent",
    });
  } else {
    insights.push({
      icon: Brain,
      title: "Building foundations",
      description: `${accuracy}% first-try accuracy, so the basics need another pass. Describe the exact step that trips ${childName} up and the lesson will target it.`,
      tone: "warn",
    });
  }

  const subjects = Object.keys(stats.subjectBreakdown);
  if (subjects.length >= 3) {
    insights.push({
      icon: Compass,
      title: "Well-rounded",
      description: `${childName} has worked across ${subjects.length} subjects.`,
      tone: "success",
    });
  } else if (stats.totalLessons >= 3 && subjects.length === 1) {
    insights.push({
      icon: Compass,
      title: "Deep dive",
      description: `All ${stats.totalLessons} lessons so far are ${subjects[0]}. One different subject would round this out.`,
      tone: "accent",
    });
  }

  if (stats.streak.current >= 3) {
    insights.push({
      icon: Award,
      title: `${stats.streak.current}-day streak`,
      description: "Regular short sessions matter more than long ones.",
      tone: "accent",
    });
  }

  return insights;
}

export function InsightsPanel({
  stats,
  childName,
}: {
  stats: ProgressStats;
  childName: string;
}) {
  const insights = buildInsights(stats, childName);

  if (insights.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Not labelled "AI": these are fixed rules over local history, and
          calling them AI would overstate what actually runs here. */}
      <h3 className="font-display text-sm font-bold tracking-tight text-ink">
        What the numbers say about {childName}
      </h3>
      <div className="space-y-2.5">
        {insights.map((insight) => (
          <InsightCard key={insight.title} {...insight} />
        ))}
      </div>
    </section>
  );
}
