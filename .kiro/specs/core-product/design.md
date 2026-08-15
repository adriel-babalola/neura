# Design — Core product

## Visual language
Two deliberate worlds, switched by pathname (`/child/*` → `data-mode="board"`):

- **Parent world — warm light (premium, Linear/Stripe benchmark):**
  canvas `#FBFAF6`, surface white `#FFFFFF`, surface2 `#F3F1EA`, ink `#1F2A25`, muted
  `#5E6E66`, hairline `#E4E2D8`, accent terracotta `#D26B4A` (+ `--glow` soft terracotta wash).
  Aurora radial gradients behind hero/auth (light-friendly, low opacity). Glass nav and cards
  (`backdrop-blur` 16px). Accent (`bg-accent`) primary buttons with light text. Massive
  tight-tracked display headlines (`font-extrabold tracking-tighter`) with ink→ink/35 gradient
  second lines. Editorial oversized ghost numerals in "How it works". Bento feature grid.
  1px borders define edges — no heavy drop shadows; only subtle accent-tinted shadows on
  primary actions and the featured pricing card.
- **Child world — warm chalkboard:** board `#1C2622`, chalk `#F2F0E6`, accent chalk-yellow
  `#F2C56B`, Rough.js chalk frame, KaTeX, chalk-dust particles. Kid-warm and untouched by the
  parent-world restyle.

Typography: Plus Jakarta Sans for display/headings, Inter for body.
Icons: lucide-react stroke icons; accent carries emphasis. **Zero emojis.**
Spacing: strict 8px/4px scale; generous whitespace; one accent color; three text shades
(heading/body/muted).

## Pages
### `/` — Landing
Sticky glass nav (logo, anchors, Sign in pill). Aurora glow. Hero: badge pill, massive
`tracking-tighter` headline "Every child learns their own way." with ink→ink/35 gradient
second line, subcopy, accent primary CTA → `/signin`, glass secondary. Bento features grid
(asymmetric 2-1 / 1-2 with hover glow), editorial "How it works" with huge ghost `01/02/03`
numerals and accent rules (middle step offset `md:mt-32`), 3-tier pricing (Free / Family
highlighted / School), glass CTA band, minimal footer. Animated with `motion` on mount +
`whileInView`.

### `/signin` — Simulated auth
Centered glass card over aurora: name input (decorative), "Who's signing in?" two role tiles
(parent `UserRound` / student `GraduationCap`), accent Continue → sets role and routes by
`onboarded`. Lock note: "stores everything on this device".

### `/onboarding` — 4-step wizard
StepProgress header + Back. Steps: (1) parent name/relation, (2) child name/age,
(3) interests (8 icon chips) + learning style (5 pill buttons), (4) frustration (4 statements +
free text). Finish writes profile and routes by role. Icon-per-option, no emoji.

### `/parent` — Build-a-lesson
Header with child avatar chip. Subject grid (Math/English/Logic/Science icons), struggle
textarea + suggestion chips, mode cards (Chalkboard `Presentation` / Story `BookOpenText`),
optional context, primary "Build {name}'s lesson" button with loading spinner. Errors shown as
accent-tinted banner.

### `/child/latest` — Lesson player (landscape dashboard)
- Header: Neura wordmark, lesson title/subject, scene counter + progress bar, sound toggle
  (`Volume2`/`VolumeX`), "Parent view" button.
- Main grid `md:grid-cols-[1fr_350px]`, `h-[100dvh]`, no vertical scroll.
- **Board pane:** board texture + `ChalkDust` ambient particles; `Blackboard` (Rough.js frame
  + KaTeX + per-line reveal) or `StoryPage` prose; reflection card fades in at the end.
- **Question rail:** "Your turn" label with pulsing dot when paused; the question card has a
  box-shadow ring (`question-alert`), a replay button, input + Try; hint / deeper-clue /
  success states. Upcoming questions listed with `HelpCircle`, solved count with
  `CheckCircle2`.

### Interaction & voice
- Question arrival: spoken "Here is a question for you." + prompt (calm, slowed, low pitch);
  card rings to signal "on the right".
- Correct: confetti burst + "Yes! You got it. Great thinking."
- Wrong (1st): speak the hint. Wrong (2nd): speak the deeper clue.
- Sound toggle persists for the session; TTS primed on first `pointerdown` for iOS.

## Animation constraints
- Question card entrance: **opacity only** (Playwright clicks `Try` immediately; transforms
  cause click races). The arrival signal is a pure box-shadow ring.
- All animations disabled under `prefers-reduced-motion` (confetti, chalk dust, rings).
