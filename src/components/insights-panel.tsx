"use client";

import { motion } from "motion/react";
import {
  Award,
  Brain,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import type { ProgressStats } from "@/lib/history";

function InsightCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 rounded-xl border border-line bg-surface p-4 transition-all hover:bg-surface-hover"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
      </div>
    </motion.div>
  );
}

export function InsightsPanel({
  stats,
  childName,
}: {
  stats: ProgressStats;
  childName: string;
}) {
  const insights: {
    icon: typeof Brain;
    title: string;
    description: string;
    color: string;
  }[] = [];

  // Generate smart insights based on data
  if (stats.totalLessons === 0) {
    insights.push({
      icon: Lightbulb,
      title: "Ready to start!",
      description: `Create ${childName}'s first lesson to see personalized insights here.`,
      color: "bg-accent/15 text-accent",
    });
  } else {
    // Accuracy insight
    const accuracy =
      stats.totalQuestions > 0
        ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
        : 0;

    if (accuracy >= 80) {
      insights.push({
        icon: Award,
        title: "Strong understanding",
        description: `${childName} is answering ${accuracy}% of questions correctly. They're building solid foundations.`,
        color: "bg-emerald-500/15 text-emerald-600",
      });
    } else if (accuracy >= 50) {
      insights.push({
        icon: TrendingUp,
        title: "Growing confidence",
        description: `${accuracy}% accuracy shows ${childName} is learning. Try shorter, more focused lessons to strengthen weak areas.`,
        color: "bg-amber-500/15 text-amber-600",
      });
    } else {
      insights.push({
        icon: Brain,
        title: "Building foundations",
        description: `${childName} is still working through the basics. Consider using story mode for a gentler approach.`,
        color: "bg-purple-500/15 text-purple-600",
      });
    }

    // Subject diversity insight
    const subjectCount = Object.keys(stats.subjectBreakdown).length;
    if (subjectCount >= 3) {
      insights.push({
        icon: Lightbulb,
        title: "Well-rounded learner",
        description: `${childName} has explored ${subjectCount} different subjects. Great variety!`,
        color: "bg-blue-500/15 text-blue-600",
      });
    } else if (stats.totalLessons >= 3 && subjectCount === 1) {
      const subj = Object.keys(stats.subjectBreakdown)[0];
      insights.push({
        icon: Lightbulb,
        title: "Deep dive mode",
        description: `${childName} is focused on ${subj}. Consider exploring other subjects too for a well-rounded experience.`,
        color: "bg-blue-500/15 text-blue-600",
      });
    }

    // Streak insight
    if (stats.streak.current >= 3) {
      insights.push({
        icon: Award,
        title: "On a roll!",
        description: `${stats.streak.current} days in a row! Consistency is the #1 predictor of learning success.`,
        color: "bg-accent/15 text-accent",
      });
    }
  }

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-bold text-ink">
        AI Insights for {childName}
      </h3>
      {insights.map((insight, i) => (
        <InsightCard
          key={i}
          icon={insight.icon}
          title={insight.title}
          description={insight.description}
          color={insight.color}
        />
      ))}
    </div>
  );
}
