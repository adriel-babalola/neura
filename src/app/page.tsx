"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  GraduationCap,
  MessageCircleQuestion,
  Play,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { ChalkDivider } from "@/components/ui";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Adapts to your child",
    desc: "Lessons are generated around their age, interests, and learning style. A dinosaur fan masters fractions with dino eggs instead of worksheets.",
    span: "lg:col-span-2",
    stat: "Personalized learning paths",
  },
  {
    icon: MessageCircleQuestion,
    title: "Socratic, never preachy",
    desc: "Neura teaches by asking questions that make kids reason, and celebrates the thinking, not just the answer.",
    span: "",
  },
  {
    icon: ShieldCheck,
    title: "Safe by design",
    desc: "No open-ended chatbot. Every lesson is generated from a structured child-safety model and validated before a child sees it.",
    span: "",
  },
  {
    icon: BarChart3,
    title: "Progress you can see",
    desc: "Parents get a plain-language view of what's clicking, what's fuzzy, and the exact moment their child starts to struggle.",
    span: "lg:col-span-2",
    stat: "Real-time progress insights",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Tell us who they are",
    desc: "A 60-second setup: name, age, interests, and how they learn best. That's all Neura needs.",
    icon: UserRound,
  },
  {
    num: "02",
    title: "Describe the struggle",
    desc: "Parents name the topic in plain words, and Neura turns it into a personalized lesson.",
    icon: MessageCircleQuestion,
  },
  {
    num: "03",
    title: "They learn and grow",
    desc: "Interactive questions, spoken prompts, and quiet celebrations keep the learning loop going.",
    icon: Sparkles,
  },
];

const TESTIMONIALS = [
  {
    text: "My daughter went from crying over math homework to asking for more lessons. The dinosaur-themed fractions were genius.",
    name: "Sarah M.",
    role: "Parent of a 7-year-old",
    rating: 5,
  },
  {
    text: "As a teacher, I've never seen AI tutoring done this thoughtfully. It actually uses the Socratic method correctly.",
    name: "James K.",
    role: "Grade 4 Teacher",
    rating: 5,
  },
  {
    text: "The chalkboard animation keeps my son focused in ways YouTube never could. He thinks he's playing a game.",
    name: "Priya R.",
    role: "Parent of a 9-year-old",
    rating: 5,
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Everything a family needs to try Neura.",
    cta: "Get started",
    features: [
      "1 child profile",
      "3 lessons a week",
      "Chalkboard + story modes",
      "Parent dashboard",
    ],
    featured: false,
  },
  {
    name: "Family",
    price: "$9",
    period: "/month",
    desc: "For households where learning never stops.",
    cta: "Start free trial",
    features: [
      "Unlimited lessons",
      "Up to 3 children",
      "Spoken question prompts",
      "Priority lesson generation",
      "Progress insights & streaks",
    ],
    featured: true,
  },
  {
    name: "School",
    price: "Custom",
    period: "pricing",
    desc: "For classrooms and learning programs.",
    cta: "Contact us",
    features: [
      "Unlimited students",
      "Teacher dashboard",
      "Data export & analytics",
      "SSO & compliance",
    ],
    featured: false,
  },
];

const TRUST_LOGOS = [
  "Adaptive AI tutoring",
  "Child-safe by design",
  "Progress stays in your browser",
  "Free to start",
];

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-canvas">
      <div className="aurora-bg" aria-hidden />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-canvas">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Neura<span className="text-accent">.</span>
          </span>
          <nav className="hidden items-center gap-7 text-[13px] text-muted md:flex">
            <a href="#why" className="transition-colors hover:text-ink">
              Why Neura
            </a>
            <a href="#how" className="transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#testimonials" className="transition-colors hover:text-ink">
              Reviews
            </a>
            <a href="#pricing" className="transition-colors hover:text-ink">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              href="/demo"
              className="inline-flex h-9 items-center gap-1.5 rounded-chip border border-line bg-surface px-3 font-display text-[11px] font-semibold text-muted transition-colors hover:border-accent/40 hover:text-ink"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              Deep-Tech Lab
            </Link>
            <Link
              href="/signin"
              className="hidden h-9 items-center rounded-chip border border-line bg-surface px-4 font-display text-[13px] font-semibold text-ink transition-colors hover:bg-surface2 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signin"
              className="inline-flex h-9 items-center gap-1.5 rounded-chip bg-accent px-4 font-display text-[13px] font-semibold text-white transition-all hover:brightness-[1.06] active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-16 pt-20 text-center md:pb-24 md:pt-28 lg:pt-32">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl font-display text-[2rem] font-extrabold leading-[1.05] tracking-tighter text-ink sm:text-[2.5rem] md:text-[3rem] lg:text-[3.25rem]"
        >
          Every child learns
          <br className="hidden sm:block" />
          {/* Solid accent rather than a gradient: the fade-out read as washed
              out against cream and cost the headline its emphasis. */}
          <span className="text-accent">their own way.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base md:text-lg"
        >
          Neura learns who your child is, their interests, how they think, and where they
          struggle, then builds a lesson just for them. Teaching through chalkboards,
          stories, and questions that feel like play.
        </motion.p>

        {/* Chalk stroke as the hero's only ornament, tying the marketing page
            to the chalkboards the product actually uses. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-7 max-w-sm"
        >
          <ChalkDivider />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/signin"
            className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-control bg-accent px-8 text-sm font-semibold text-white shadow-none transition-all hover:scale-[1.02] hover:brightness-[1.06] active:scale-[0.98]"
          >
            Start free, no credit card
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-control border border-line bg-surface px-8 text-[13px] font-semibold text-ink transition-colors hover:bg-surface2"
          >
            <Play className="h-4 w-4 text-accent" />
            Watch how it works
          </a>
        </motion.div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {TRUST_LOGOS.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 text-xs font-medium text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
              {t}
            </span>
          ))}
        </motion.div>

        {/* Hero visual - App preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mt-16 w-full max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-card border border-line bg-surface" style={{ boxShadow: "var(--shadow-lift)" }}>
            {/* Fake browser chrome. The three dots are chalk-toned rather than
                the red/yellow/green macOS colours, which pulled the eye away from
                the dashboard mock underneath. */}
            <div className="flex h-10 items-center gap-2 border-b border-line bg-surface2 px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="mx-auto rounded-chip bg-surface px-16 py-1 text-[10px] text-muted">
                neura.app/parent
              </span>
            </div>
            {/* Dashboard preview */}
            <div className="grid grid-cols-4 gap-3 p-6">
              {/* Mini sidebar */}
              <div className="hidden space-y-2 lg:block">
                <div className="h-8 w-full rounded-lg bg-accent-dim" />
                <div className="h-6 w-3/4 rounded-chip bg-surface2" />
                <div className="h-6 w-2/3 rounded-chip bg-surface2" />
                <div className="h-6 w-3/4 rounded-chip bg-surface2" />
              </div>
              {/* Content area */}
              <div className="col-span-4 space-y-3 lg:col-span-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-control border border-line bg-accent-dim p-4">
                    <div className="h-3 w-8 rounded bg-accent/30" />
                    <div className="mt-2 h-6 w-12 rounded bg-accent/40" />
                  </div>
                  <div className="rounded-control border border-line bg-surface2 p-4">
                    <div className="h-3 w-10 rounded bg-line" />
                    <div className="mt-2 h-6 w-8 rounded bg-muted/20" />
                  </div>
                  <div className="rounded-control border border-line bg-surface2 p-4">
                    <div className="h-3 w-12 rounded bg-line" />
                    <div className="mt-2 h-6 w-10 rounded bg-muted/20" />
                  </div>
                </div>
                <div className="rounded-control border border-line bg-surface2 p-4">
                  <div className="flex gap-2">
                    {[40, 60, 30, 80, 50, 70, 45].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-accent/30"
                        style={{ height: `${h}%`, minHeight: `${h * 0.5}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow behind */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
          />
        </motion.div>
      </section>

      {/* ── Features (bento) ────────────────────────────── */}
      <section id="why" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 md:py-28">
        <div className="mb-14 max-w-xl">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Why Neura
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink md:text-4xl">
            One lesson at a time, built around your child.
          </h2>
          <p className="mt-4 text-muted">
            Not a chat bot, not a quiz app. A real tutor that adapts to how your child thinks.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08 }}
                className={`card-hover group relative overflow-hidden rounded-card border border-line bg-surface p-7 ${f.span}`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-glow/15 blur-3xl transition-opacity opacity-0 group-hover:opacity-100"
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-control border border-line bg-surface2 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-base font-bold text-ink">{f.title}</h3>
                <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">{f.desc}</p>
                {f.stat ? (
                  <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {f.stat}
                  </p>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how" className="relative z-10 bg-surface2 py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
              How it works
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink md:text-4xl">
              Three steps to a breakthrough
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              From confusion to confidence in minutes, not months.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card-hover relative rounded-card border border-line bg-surface p-8 text-center"
                >
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-accent-dim">
                    <Icon className="h-6 w-6 text-accent" />
                  </span>
                  <span className="absolute right-4 top-4 font-display text-3xl font-black text-line/80">
                    {s.num}
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 md:py-28">
        <div className="mb-14 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Loved by families
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink md:text-4xl">
            Parents see the difference.
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-hover relative rounded-card border border-line bg-surface p-6"
            >
              <Quote className="mb-3 h-5 w-5 text-accent/40" />
              <p className="text-[13px] leading-relaxed text-ink">{t.text}</p>
              <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-dim font-display text-xs font-bold text-accent">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-3.5 w-3.5 fill-accent text-accent"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id='pricing' className='relative z-10 bg-surface2 py-10 md:py-12'>
        <div className='mx-auto w-full max-w-7xl px-6'>
          <div className='mb-6 text-center'>
            <p className='font-display text-xs font-bold uppercase tracking-widest text-accent'>
              Pricing
            </p>
            <h2 className='mt-3 font-display text-xl font-bold tracking-tight text-ink md:text-2xl'>
              Coming soon
            </h2>
            <p className='mx-auto mt-2 max-w-md text-[13px] text-muted'>
              Simple, honest pricing for families. We&apos;ll share it here soon.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 md:py-24">
        <div className="relative overflow-hidden rounded-card border border-line bg-surface px-8 py-16 text-center md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-glow/20 blur-3xl"
          />
          <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-card border border-line bg-surface2 text-accent">
            <GraduationCap className="h-7 w-7" />
          </span>
          <h2 className="relative mx-auto mt-6 max-w-2xl font-display text-2xl font-bold tracking-tight text-ink md:text-4xl">
            Ready to see your child light up about learning?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted">
            Two minutes from here to a lesson built around their world. No credit card needed.
          </p>
          <Link
            href="/signin"
            className="group relative mt-8 inline-flex h-[52px] items-center justify-center gap-2 rounded-control bg-accent px-8 text-sm font-semibold text-white shadow-none transition-all hover:scale-[1.02] hover:brightness-[1.06] active:scale-[0.98]"
          >
            Start free today
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-line/70 py-10">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="font-display text-base font-bold text-ink">
                Neura<span className="text-accent">.</span>
              </span>
              <span className="text-xs text-muted">
                Made with care for kids and parents.
              </span>
            </div>
            <div className="flex max-w-xl flex-col items-center gap-2 text-xs text-muted sm:flex-row sm:items-start sm:gap-3 sm:text-left">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0.5" />
              <span>
                Profiles and progress stay in your browser. Lessons are written by an
                AI provider we call with a minimised prompt, and can be pointed at
                your own server instead.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
