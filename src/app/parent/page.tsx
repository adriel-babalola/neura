"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  BookOpenText,
  Calculator,
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Plus,
  Presentation,
  Puzzle,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Button, Card, Logo, Textarea } from "@/components/ui";
import { InsightsPanel } from "@/components/insights-panel";
import { useProfile } from "@/lib/profile";
import { useLessonStore } from "@/lib/lesson-store";
import { useLessonHistory } from "@/lib/history";
import { useMounted } from "@/lib/use-mounted";
import type { Lesson, LessonMode } from "@/lib/types";

const SUBJECTS = [
  { label: "Math", icon: Calculator, color: "text-blue-400" },
  { label: "English", icon: BookOpen, color: "text-emerald-400" },
  { label: "Logic", icon: Puzzle, color: "text-purple-400" },
  { label: "Science", icon: FlaskConical, color: "text-amber-400" },
];

const SUGGESTIONS = [
  "Fractions are really confusing",
  "Had trouble with multiplication tables",
  "Struggles with word problems",
  "Can't understand place value",
  "Mixing up there/their/they're",
  "Run-on sentences",
];

const MODES: { value: LessonMode; label: string; icon: typeof Presentation; desc: string }[] = [
  {
    value: "board",
    label: "Chalkboard",
    icon: Presentation,
    desc: "Teacher-style board lesson with animated math",
  },
  {
    value: "story",
    label: "Story",
    icon: BookOpenText,
    desc: "A narrative adventure with embedded puzzles",
  },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "New Lesson", icon: Plus, id: "create" },
  { label: "Progress", icon: TrendingUp, id: "progress" },
  { label: "Settings", icon: Settings, id: "settings" },
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-md ${
        accent
          ? "border-accent/40 bg-gradient-to-br from-accent-dim to-surface"
          : "border-line bg-surface"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
          <p className="font-display text-2xl font-bold tracking-tight text-ink">{value}</p>
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            accent ? "bg-accent/15 text-accent" : "bg-surface2 text-muted"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/10 blur-2xl"
        />
      )}
    </motion.div>
  );
}

function WeeklyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
            className={`w-full min-h-[4px] rounded-t-md ${
              v > 0 ? "bg-accent" : "bg-line"
            }`}
          />
          <span className="text-[10px] text-muted">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function LessonHistoryItem({
  title,
  subject,
  focus,
  date,
  correct,
  total,
}: {
  title: string;
  subject: string;
  focus: string;
  date: string;
  correct: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-all hover:border-accent/30 hover:bg-surface-hover">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-dim">
        <GraduationCap className="h-5 w-5 text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold text-ink">{title}</p>
        <p className="truncate text-xs text-muted">
          {subject} · {focus}
        </p>
      </div>
      <div className="hidden flex-col items-end sm:flex">
        <span className="text-xs font-medium text-ink">{pct}%</span>
        <span className="text-[10px] text-muted">{date}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export default function ParentPage() {
  const router = useRouter();
  const { profile, reset } = useProfile();
  const mounted = useMounted();
  const { saveLesson } = useLessonStore();
  const { history, stats } = useLessonHistory();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [subject, setSubject] = useState("");
  const [struggle, setStruggle] = useState("");
  const [context, setContext] = useState("");
  const [mode, setMode] = useState<LessonMode>("board");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  if (!mounted) return null;

  if (!profile?.onboarded) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas px-6">
        <div className="space-y-4 text-center">
          <p className="text-muted">No child profile yet.</p>
          <Button onClick={() => router.push("/onboarding")}>Set up onboarding</Button>
        </div>
      </main>
    );
  }

  const child = profile.child;

  const generate = async () => {
    if (!subject || !struggle.trim() || generating) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child,
          subject,
          struggle: struggle.trim(),
          context: context.trim(),
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Generation failed");

      const lesson: Lesson = data.lesson;
      saveLesson(lesson);
      router.push("/child/latest");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
      : 0;

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        {/* Logo area */}
        <div className="flex h-16 items-center gap-2 border-b border-line px-6">
          <Logo />
        </div>

        {/* Child Profile Card */}
        <div className="border-b border-line px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-accent-dim/50 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-white">
              {child.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-ink">
                {child.name}
              </p>
              <p className="text-xs text-muted">
                Age {child.age} · {child.interest}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-accent-dim text-ink shadow-sm"
                    : "text-muted hover:bg-surface2 hover:text-ink"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? "text-accent" : ""}`} />
                {item.label}
                {item.id === "create" && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-white">
                    +
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Streak widget */}
        <div className="border-t border-line px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface2 px-4 py-3">
            <Flame className="h-5 w-5 text-accent" />
            <div>
              <p className="font-display text-sm font-bold text-ink">
                {stats.streak.current} day streak
              </p>
              <p className="text-[11px] text-muted">
                Best: {stats.streak.longest} days
              </p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="border-t border-line px-4 py-3">
          <button
            onClick={() => {
              reset();
              router.push("/");
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile + breadcrumb) */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface/50 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden lg:block">
              <h1 className="font-display text-lg font-bold text-ink">
                {activeTab === "dashboard" && `Good ${getGreeting()}, ${profile.parent.name || "there"}!`}
                {activeTab === "create" && `Create a lesson for ${child.name}`}
                {activeTab === "progress" && `${child.name}'s Progress`}
                {activeTab === "settings" && "Settings"}
              </h1>
              <p className="text-xs text-muted">
                {activeTab === "dashboard" && "Here's how learning is going."}
                {activeTab === "create" && "Tell Neura what they need help with."}
                {activeTab === "progress" && "Track growth over time."}
                {activeTab === "settings" && "Manage your child's profile."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile nav tabs */}
            <div className="flex items-center gap-1 lg:hidden">
              {NAV_ITEMS.slice(0, 3).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                      activeTab === item.id
                        ? "bg-accent-dim text-accent"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setActiveTab("create")}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-all hover:brightness-[1.06] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Lesson</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard
                    icon={Flame}
                    label="Day Streak"
                    value={stats.streak.current}
                    sub={`Best: ${stats.streak.longest}`}
                    accent
                  />
                  <StatCard
                    icon={GraduationCap}
                    label="Lessons"
                    value={stats.totalLessons}
                    sub="Completed"
                  />
                  <StatCard
                    icon={Target}
                    label="Accuracy"
                    value={`${accuracy}%`}
                    sub={`${stats.totalCorrect}/${stats.totalQuestions} correct`}
                  />
                  <StatCard
                    icon={Trophy}
                    label="Subjects"
                    value={Object.keys(stats.subjectBreakdown).length}
                    sub="Explored"
                  />
                </div>

                {/* Two column layout */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Weekly Activity */}
                  <Card className="col-span-2 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-sm font-bold text-ink">
                          Weekly Activity
                        </h3>
                        <p className="text-xs text-muted">Lessons completed this week</p>
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-accent-dim px-2.5 py-1 text-xs font-medium text-accent">
                        <TrendingUp className="h-3 w-3" />
                        Active
                      </span>
                    </div>
                    <WeeklyChart data={stats.weeklyActivity} />
                  </Card>

                  {/* Quick Actions */}
                  <Card className="p-6">
                    <h3 className="mb-4 font-display text-sm font-bold text-ink">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab("create")}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition-all hover:border-accent/40 hover:bg-accent-dim/30"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">Generate Lesson</p>
                          <p className="text-[11px] text-muted">AI-powered tutoring</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab("progress")}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition-all hover:border-accent/40 hover:bg-accent-dim/30"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                          <TrendingUp className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">View Progress</p>
                          <p className="text-[11px] text-muted">Track improvements</p>
                        </div>
                      </button>
                      <button
                        onClick={() => router.push("/child/latest")}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition-all hover:border-accent/40 hover:bg-accent-dim/30"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-500">
                          <Presentation className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">Latest Lesson</p>
                          <p className="text-[11px] text-muted">Continue learning</p>
                        </div>
                      </button>
                    </div>
                  </Card>
                </div>

                {/* Recent Lessons */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-ink">
                      Recent Lessons
                    </h3>
                    {history.length > 3 && (
                      <button
                        onClick={() => setActiveTab("progress")}
                        className="cursor-pointer text-xs font-medium text-accent hover:underline"
                      >
                        View all →
                      </button>
                    )}
                  </div>
                  {history.length > 0 ? (
                    <div className="space-y-2">
                      {history.slice(0, 4).map((r) => (
                        <LessonHistoryItem
                          key={r.id}
                          title={r.title}
                          subject={r.subject}
                          focus={r.focus}
                          correct={r.questionsCorrect}
                          total={r.questionsTotal}
                          date={new Date(r.completedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-dim">
                        <GraduationCap className="h-6 w-6 text-accent" />
                      </div>
                      <p className="font-display text-sm font-semibold text-ink">
                        No lessons yet
                      </p>
                      <p className="mt-1 max-w-xs text-xs text-muted">
                        Create your first lesson and watch {child.name}&apos;s progress grow here.
                      </p>
                      <Button
                        onClick={() => setActiveTab("create")}
                        size="md"
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4" />
                        Create first lesson
                      </Button>
                    </Card>
                  )}
                </div>

                {/* AI Insights */}
                <InsightsPanel stats={stats} childName={child.name} />
              </motion.div>
            )}

            {activeTab === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-6 py-8"
              >
                <div className="grid gap-6 lg:gap-8 lg:grid-cols-5">
                  {/* Main form */}
                  <Card className="lg:col-span-3 space-y-6 p-6">
                    <div>
                      <h2 className="font-display text-lg font-bold text-ink">Lesson Details</h2>
                      <p className="mt-1 text-xs text-muted">
                        Tell Neura what {child.name} needs help with
                      </p>
                    </div>

                    {/* Subject Selection */}
                    <div>
                      <p className="mb-3 font-display text-sm font-semibold text-ink">Subject</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {SUBJECTS.map((s) => {
                          const Icon = s.icon;
                          return (
                            <button
                              key={s.label}
                              onClick={() => setSubject(s.label)}
                              className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all cursor-pointer ${
                                subject === s.label
                                  ? "border-accent bg-accent-dim text-ink shadow-sm"
                                  : "border-line bg-surface2 text-muted hover:border-accent/40 hover:bg-surface-hover"
                              }`}
                            >
                              <Icon className="h-6 w-6" />
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Struggle */}
                    <div>
                      <p className="mb-2 font-display text-sm font-semibold text-ink">
                        What did {child.name} struggle with?
                      </p>
                      <Textarea
                        value={struggle}
                        onChange={(e) => setStruggle(e.target.value)}
                        placeholder='e.g. "They could not add fractions with different denominators"'
                        rows={3}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStruggle(s)}
                            className="rounded-full border border-line bg-surface2 px-3 py-1.5 text-xs text-muted transition-all hover:border-accent/50 hover:bg-accent-dim hover:text-ink cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Additional context */}
                    <div>
                      <p className="mb-2 font-display text-sm font-semibold text-ink">
                        Extra context{" "}
                        <span className="font-normal text-muted">(optional)</span>
                      </p>
                      <Textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder='e.g. "There is a test on Thursday", "She learns best when it feels like a game"'
                        rows={2}
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600"
                      >
                        {error}
                      </motion.p>
                    )}

                    <Button
                      onClick={generate}
                      disabled={!subject || !struggle.trim() || generating}
                      size="lg"
                      className="w-full"
                    >
                      {generating ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
                          Building {child.name}&apos;s lesson…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Build {child.name}&apos;s lesson
                        </>
                      )}
                    </Button>
                  </Card>

                  {/* Sidebar - Mode + Preview */}
                  <div className="space-y-4 lg:col-span-2">
                    <Card className="p-5">
                      <p className="mb-3 font-display text-sm font-semibold text-ink">
                        Teaching Mode
                      </p>
                      <div className="space-y-3">
                        {MODES.map((m) => {
                          const Icon = m.icon;
                          return (
                            <button
                              key={m.value}
                              onClick={() => setMode(m.value)}
                              className={`w-full rounded-xl border p-4 text-left transition-all cursor-pointer ${
                                mode === m.value
                                  ? "border-accent bg-accent-dim shadow-sm"
                                  : "border-line bg-surface2 hover:border-accent/40"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-accent" />
                                <div>
                                  <span className="block font-display text-sm font-bold text-ink">
                                    {m.label}
                                  </span>
                                  <span className="mt-0.5 block text-xs leading-snug text-muted">
                                    {m.desc}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Lesson preview info */}
                    <Card className="p-5">
                      <p className="mb-3 font-display text-sm font-semibold text-ink">
                        Lesson Preview
                      </p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Student</span>
                          <span className="font-medium text-ink">{child.name}</span>
                        </div>
                        <div className="h-px bg-line" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Subject</span>
                          <span className="font-medium text-ink">
                            {subject || "Not selected"}
                          </span>
                        </div>
                        <div className="h-px bg-line" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Mode</span>
                          <span className="font-medium text-ink capitalize">{mode}</span>
                        </div>
                        <div className="h-px bg-line" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Interest</span>
                          <span className="font-medium text-ink">{child.interest}</span>
                        </div>
                        <div className="h-px bg-line" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Style</span>
                          <span className="font-medium text-ink capitalize">
                            {child.learningStyle}
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* Tips */}
                    <Card className="border-accent/20 bg-gradient-to-b from-accent-dim/50 to-surface p-5">
                      <div className="flex gap-3">
                        <Zap className="h-5 w-5 shrink-0 text-accent" />
                        <div>
                          <p className="font-display text-xs font-bold text-ink">Pro tip</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            Be specific about the struggle. &quot;Can&apos;t add fractions with
                            different denominators&quot; works better than &quot;fractions are
                            hard&quot;.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "progress" && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8"
              >
                {/* Progress Header */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                        <Target className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted">Overall Accuracy</p>
                        <p className="font-display text-xl font-bold text-ink">{accuracy}%</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                        <Clock className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted">Total Questions</p>
                        <p className="font-display text-xl font-bold text-ink">
                          {stats.totalQuestions}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
                        <Calendar className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted">Longest Streak</p>
                        <p className="font-display text-xl font-bold text-ink">
                          {stats.streak.longest} days
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Subject Breakdown */}
                {Object.keys(stats.subjectBreakdown).length > 0 && (
                  <Card className="p-6">
                    <h3 className="mb-4 font-display text-sm font-bold text-ink">
                      Subject Breakdown
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(stats.subjectBreakdown).map(([subj, count]) => {
                        const pct = Math.round((count / stats.totalLessons) * 100);
                        return (
                          <div key={subj} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-ink">{subj}</span>
                              <span className="text-muted">
                                {count} lesson{count !== 1 ? "s" : ""} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-line">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="h-full rounded-full bg-accent"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Full History */}
                <div>
                  <h3 className="mb-4 font-display text-sm font-bold text-ink">
                    All Lessons ({history.length})
                  </h3>
                  {history.length > 0 ? (
                    <div className="space-y-2">
                      {history.map((r) => (
                        <LessonHistoryItem
                          key={r.id}
                          title={r.title}
                          subject={r.subject}
                          focus={r.focus}
                          correct={r.questionsCorrect}
                          total={r.questionsTotal}
                          date={new Date(r.completedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="flex flex-col items-center justify-center p-10 text-center">
                      <TrendingUp className="h-8 w-8 text-muted/40" />
                      <p className="mt-3 font-display text-sm font-semibold text-ink">
                        Progress will show here
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Complete lessons to see {child.name}&apos;s growth over time.
                      </p>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-2xl space-y-6 px-6 py-8"
              >
                <Card className="p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-ink">
                    Child Profile
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 rounded-xl bg-surface2 p-4">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent font-display text-lg font-bold text-white">
                        {child.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-display text-lg font-bold text-ink">{child.name}</p>
                        <p className="text-sm text-muted">
                          Age {child.age} · Loves {child.interest}
                        </p>
                        <p className="text-xs text-muted">
                          Learning style: {child.learningStyle} · {child.frustration}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/onboarding")}
                        className="flex-1"
                      >
                        Edit profile
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          reset();
                          router.push("/");
                        }}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        Reset all data
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="mb-2 font-display text-lg font-bold text-ink">About Neura</h3>
                  <p className="text-sm text-muted">
                    Neura is an adaptive AI tutor that builds personalized lessons around your
                    child&apos;s interests, age, and learning style. Every lesson uses the Socratic
                    method: teaching through questions, not answers.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
