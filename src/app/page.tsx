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
  ShieldCheck,
  UserRound,
  Wand2,
} from "lucide-react";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Adapts to your child",
    desc: "Lessons are generated around their age, interests, and learning style, so a dinosaur fan masters fractions with dino eggs instead of worksheets.",
    span: "lg:col-span-2",
    stat: "Built around what they love",
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
    stat: "From struggle to confidence",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Tell us who they are",
    desc: "A 60-second setup: name, age, interests, and how they learn best. That's the entire profile Neura needs.",
  },
  {
    num: "02",
    title: "Neura builds the lesson",
    desc: "Parents name the struggle in plain words, and Neura turns it into a chalkboard lecture or a story around their world.",
  },
  {
    num: "03",
    title: "They learn and grow",
    desc: "Pause-and-answer questions, spoken prompts, and quiet celebrations keep the learning loop going.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Everything a family needs to try Neura.",
    cta: "Get started",
    features: ["1 child profile", "3 lessons a week", "Chalkboard + story modes", "Parent dashboard"],
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
      "Progress insights",
    ],
    featured: true,
  },
  {
    name: "School",
    price: "Custom",
    period: "pricing",
    desc: "For classrooms and learning programs.",
    cta: "Contact us",
    features: ["Unlimited students", "Teacher dashboard", "Data export", "SSO & compliance"],
    featured: false,
  },
];

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-canvas">
      <div className="aurora-bg" aria-hidden />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            Neura<span className="text-accent">.</span>
          </span>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#why" className="transition-colors hover:text-ink">
              Why Neura
            </a>
            <a href="#how" className="transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-ink">
              Pricing
            </a>
          </nav>
          <Link
            href="/signin"
            className="inline-flex h-9 items-center rounded-lg border border-line bg-surface/50 px-4 font-display text-sm font-medium text-ink backdrop-blur-sm transition-colors hover:bg-surface-hover"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-24 text-center md:pb-28 md:pt-32">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 max-w-5xl font-display text-5xl font-extrabold tracking-tighter text-ink md:text-7xl"
        >
          Every child learns
          <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-ink via-ink/70 to-ink/35 bg-clip-text text-transparent">
            their own way.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-3xl text-lg leading-relaxed text-muted md:text-xl"
        >
          Neura learns who your child is: their interests, how they learn best, and the exact
          moment they start to struggle. It uses all of that to build a lesson just for them,
          teaching through chalkboards, friendly questions, and stories that feel like play.
          Every lesson ends with a real &ldquo;aha&rdquo;, not just an answer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/signin"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-8 text-sm font-semibold text-canvas shadow-sm shadow-accent/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-surface/30 px-8 text-sm font-semibold text-ink backdrop-blur-sm transition-colors hover:bg-surface"
          >
            See how it works
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-xs text-muted/80"
        >
          Works on iPad, iPhone, and any browser. No credit card. Private by design.
        </motion.p>
      </section>

      {/* ── Features (bento) ────────────────────────────── */}
      <section id="why" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <div className="mb-12 max-w-xl">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Why Neura
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
            One lesson at a time, built around your child.
          </h2>
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
                transition={{ delay: i * 0.05 }}
                className={`group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-colors hover:bg-surface2 ${f.span}`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-glow/15 blur-3xl transition-opacity opacity-0 group-hover:opacity-100"
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface2 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{f.desc}</p>
                {f.stat ? (
                  <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {f.stat}
                  </p>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── How it works (editorial) ────────────────────── */}
      <section id="how" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <div className="mb-16 md:w-1/2">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
            From &ldquo;it&rsquo;s confusing&rdquo;
            <br />
            to &ldquo;I get it!&rdquo;
          </h2>
        </div>

        <div className="relative mx-auto grid max-w-4xl gap-14 md:grid-cols-2 md:gap-16">
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`relative flex flex-col ${
                i === 1 ? "md:mt-32" : ""
              } ${i === 2 ? "md:col-span-2 md:w-1/2 md:justify-self-end" : ""}`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -left-4 -top-14 select-none font-display text-[110px] font-black leading-none tracking-tighter text-surface2/90 md:-left-10 md:-top-20 md:text-[150px]"
              >
                {s.num}
              </div>
              <div className="relative z-10 pt-6">
                <div className="mb-5 h-px w-12 bg-accent" />
                <h3 className="font-display text-2xl font-bold text-ink">{s.title}</h3>
                <p className="mt-3 max-w-sm leading-relaxed text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <div className="mb-12 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
            Simple, honest pricing.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Start free with no credit card. Upgrade when your family is ready for more.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.featured
                  ? "border-accent/60 bg-surface2 shadow-[0_0_40px_-12px_var(--glow)]"
                  : "border-line bg-surface"
              }`}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white">
                  Most popular
                </span>
              ) : null}
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-lg font-bold text-ink">{plan.name}</h3>
                <span className="flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold tracking-tight text-ink">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted">{plan.period}</span>
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{plan.desc}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signin"
                className={`mt-8 inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-all active:scale-[0.98] ${
                  plan.featured
                    ? "bg-accent text-canvas shadow-sm shadow-accent/25 hover:brightness-[1.06]"
                    : "border border-line text-ink hover:bg-surface2"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 md:pb-24">
        <div className="glass relative overflow-hidden rounded-3xl border border-line px-8 py-14 text-center md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-glow/20 blur-3xl"
          />
          <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface2 text-accent">
            <GraduationCap className="h-6 w-6" />
          </span>
          <h2 className="relative mx-auto mt-6 max-w-2xl font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
            Ready to see your child light up about learning?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted">
            Two minutes from here to a lesson built around their world.
          </p>
          <Link
            href="/signin"
            className="group relative mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-8 text-sm font-semibold text-canvas shadow-sm shadow-accent/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Start free today
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-line/70 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface2">
              <UserRound className="h-3 w-3 text-accent" />
            </span>
            <span>
              Neura<span className="text-accent">.</span> Made with care for kids and parents.
            </span>
          </span>
          <span className="flex items-center gap-2">
            <Wand2 className="h-3 w-3" />
            Sign-in is simulated: no account, no email, nothing stored.
          </span>
        </div>
      </footer>
    </main>
  );
}
