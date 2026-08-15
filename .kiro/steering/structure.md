# Neura — Codebase Map

```
neura/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # fonts, ThemeMode, ProfileProvider, <html data-mode="parent">
│   │   ├── page.tsx                # Landing page (marketing hero, features, how-it-works, footer)
│   │   ├── globals.css             # Tailwind v4, CSS variables, board texture, animations
│   │   ├── signin/page.tsx         # Simulated sign-in (role cards + name field → onboarding/dashboard)
│   │   ├── onboarding/page.tsx     # 4-step wizard: parent → child → interests/style → frustration
│   │   ├── parent/page.tsx         # Parent dashboard: build-a-lesson form → POST API → /child/latest
│   │   ├── child/latest/page.tsx   # Child entry: hydration gate + LessonView
│   │   └── api/
│   │       └── generate-lesson/route.ts  # POST: validate → generateLesson() → {lesson}
│   ├── components/
│   │   ├── ui.tsx                  # Logo, Button, Input, Textarea, Card, Field, StepProgress
│   │   ├── theme-mode.tsx          # sets <html data-mode="board"> on /child routes
│   │   ├── blackboard.tsx          # Rough.js frame + per-line reveal + KaTeX InlineMath
│   │   ├── lesson-view.tsx         # THE lesson player: header, scene grid, question rail, voice, confetti
│   │   ├── chalk-dust.tsx          # lightweight canvas ambient particles (board background)
│   └── lib/
│       ├── types.ts                # Profile, ChildProfile, Lesson, Question, LessonMode, etc.
│       ├── profile.tsx             # localStorage "neura:profile" store (useSyncExternalStore)
│       ├── lesson-store.ts         # localStorage "neura:lesson" store (useSyncExternalStore)
│       ├── use-mounted.ts          # hydration-safe mount gate (useSyncExternalStore)
│       ├── speech.ts               # Web Speech API wrapper (calm voice, toggle, iOS priming)
│       ├── gemini.ts               # server-only Gemini call + JSON schema + safety prompt
│       └── fallback.ts             # offline demo lesson "The Pizza That Had to Be Shared"
├── tests/
│   └── full-flow.mjs               # Playwright suite, 25 checks, screenshots → .dev-screenshots/
├── .kiro/
│   ├── steering/                   # this doc + product/tech/patterns
│   ├── specs/core-product/         # requirements / design / tasks
│   └── settings/mcp.json
├── eslint.config.mjs               # ignores scripts/**, tests/**, /.dev-screenshots
├── .gitignore                      # .env.local, /tests, /.dev-screenshots, .next
├── .env.local                      # GEMINI_API_KEY (working key present)
└── package.json
```

## Route → behavior
| Route | Auth gate | State read |
| --- | --- | --- |
| `/` | none | none (marketing only) |
| `/signin` | none | sets `neura:profile.role`, routes by `onboarded` |
| `/onboarding` | `useMounted` | writes `neura:profile` |
| `/parent` | `useMounted` + `profile.onboarded` | reads profile, writes `neura:lesson` |
| `/child/latest` | `useMounted` + lesson present | reads profile + lesson |
| `/api/generate-lesson` | server | env `GEMINI_API_KEY` |

## Themes
Two modes switched by pathname in `theme-mode.tsx`:
- `data-mode="parent"` (default, **warm light premium**): canvas `#FBFAF6`, surface `#FFFFFF`, surface2 `#F3F1EA`, ink `#1F2A25`, muted `#5E6E66`, line `#E4E2D8`, accent terracotta `#D26B4A`. Accent (`bg-accent`) primary buttons, glass cards (`border-line` + `backdrop-blur`), `aurora-bg` light radial wash behind hero/auth screens.
- `data-mode="board"` (child, **warm chalkboard**): board `#1C2622`, chalk `#F2F0E6`, accent chalk-yellow `#F2C56B`. Preserved unchanged — the kid world stays warm.

Tailwind maps these to classes: `text-ink`, `bg-canvas`, `bg-board`, `text-chalk`,
`bg-surface`, `bg-surface2`, `bg-surface-hover`, `text-muted`, `border-line`, `text-accent`,
`bg-accent-dim`, `text-success`, `text-warn`, `bg-accent`, `bg-glow`.

Design rules (parent world): one accent, three text shades, 8px spacing scale, thin 1px
borders instead of drop shadows, glassmorphism only on nav/cards (blur 16px), no emoji, no
decorative effects.
