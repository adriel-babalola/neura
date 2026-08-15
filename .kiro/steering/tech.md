# Neura — Tech Stack

> Read `node_modules/next/dist/docs/` before writing Next.js code — this Next.js version has
> breaking changes vs. older training data.

## Stack (exact versions)
- **Next.js 16.3.1** — App Router, static pages + one dynamic API route.
- **React 19.2.8 / react-dom 19.2.8** — client components, `useSyncExternalStore` stores.
- **TypeScript 5**, ESLint 9 flat config (`eslint.config.mjs`), `eslint-config-next`.
- **Tailwind CSS v4** — `@import "tailwindcss"` + `@theme inline` tokens in
  `src/app/globals.css`. No `tailwind.config.js`; tokens map CSS variables via `@theme inline`.
- **next/font** — Plus Jakarta Sans (`--font-plus-jakarta`) display + Inter (`--font-inter`).
- **@google/genai 2.17** — `GoogleGenAI`, `responseJsonSchema`, `thinkingConfig`.
- **motion 13** (`motion/react`) — entrance/presence animations.
- **react-katex + katex 0.18** — inline LaTeX on the board.
- **roughjs 4.6** — hand-drawn chalk frame. **Gotcha:** rough.js 4.x returns SVG nodes but does
  NOT append them — you must `appendChild` (see `blackboard.tsx`).
- **lucide-react 1.31** — the only icon set. Icons are SVGs, so SVG-count-based tests must
  target `svg[data-blackboard]`, not all SVGs.
- **canvas-confetti 1.9** — correct-answer celebration (`disableForReducedMotion: true`).
- **Web Speech API** — built-in TTS (`src/lib/speech.ts`), no dependency.
- **Playwright 1.62** (devDependency) — browser testing via `tests/full-flow.mjs`.

## Runtime model
- Static routes (pre-rendered): `/`, `/signin`, `/onboarding`, `/parent`, `/child/latest`.
- Dynamic: `POST /api/generate-lesson` (server route).
- Data-dependent pages read `localStorage` client-side and are hydration-gated with
  `useMounted()` (see patterns).

## Environment
- `GEMINI_API_KEY` lives in `.env.local` (gitignored, must exist at demo time).
  API returns 503 with `detail` when the key is missing.
- Dev server: `npm run dev`. **Do not delete `.next` while the dev server is running.**
  After deleting `.next`, run `npx next typegen` before `tsc` (otherwise `LayoutProps` errors).

## Scripts
| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server on :3000 |
| `npm run build` | production build (wipes `.next`) |
| `npm run start` | serve production build |
| `npm run lint` | ESLint (flat config) |
| `node tests/full-flow.mjs` | full browser suite (25 checks, needs dev server up) |
| `npx tsc --noEmit` | typecheck |
| `npx next typegen` | regenerate route types |

## Verification checklist (before submission)
1. `npx next typegen && npx tsc --noEmit` — clean.
2. `npm run lint` — exit 0, no warnings.
3. `npm run build` — all routes compile.
4. `node tests/full-flow.mjs` — 25/25 PASS (server must be running on :3000).
