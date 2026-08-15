# Feature: Core product (hackathon submission)

Slug: `core-product`

## Context
Everything below is **already implemented and green**. This spec documents the acceptance
criteria (mirrored by `tests/full-flow.mjs`) so a continuation agent knows what "done" means
and what must never regress.

## Requirements (in scope)
| ID | Requirement | Status |
| --- | --- | --- |
| REQ-1 | Landing page with brand ("Neura."), marketing hero, features, how-it-works, footer. No emojis. | ✅ |
| REQ-2 | Simulated sign-in at `/signin` (no backend): choose role, route to onboarding or dashboard. | ✅ |
| REQ-3 | Onboarding wizard (4 steps) writes a real `neura:profile` in localStorage. | ✅ |
| REQ-4 | Parent dashboard: pick subject, describe struggle (with suggestions), pick mode (board/story), optional context. | ✅ |
| REQ-5 | `POST /api/generate-lesson` produces a schema-valid lesson from Gemini `gemini-2.5-flash`. | ✅ |
| REQ-6 | Board mode: Rough.js chalk frame, self-writing lines, LaTeX via KaTeX, scene auto-advance. | ✅ |
| REQ-7 | Story mode: prose-only narrative (no chalkboard), still pauses for questions. | ✅ |
| REQ-8 | Questions pause the lesson; Socratic hints (2 attempts → deeper clue); loose answer matching (`accept[]`). | ✅ |
| REQ-9 | Child view is a landscape dashboard (board + question rail) with zero vertical overflow. | ✅ |
| REQ-10 | Voice: question arrival + feedback spoken via Web Speech API; header toggle; iPad gesture priming. | ✅ |
| REQ-11 | Correct answers: confetti + spoken praise; progress bar; reflection at the end. | ✅ |
| REQ-12 | Parent can return to `/parent` from the lesson header at any time. | ✅ |
| REQ-13 | Professional icons (lucide-react) everywhere; zero emojis in the UI. | ✅ |
| REQ-14 | Hydration-safe: localStorage pages render `null` until mounted; no hydration errors on hard refresh. | ✅ |
| REQ-15 | All 25 Playwright checks pass. | ✅ |

## Out of scope (deliberately)
- Real authentication, backend database, multi-user accounts.
- Analytics, persistence across devices, COPPA consent flows.
- Anything that adds a heavy dependency (tsParticles was rejected: 346 KB vs. a 40-line canvas).

## Acceptance criteria (regression guard)
1. `npx next typegen && npx tsc --noEmit` exit 0.
2. `npm run lint` exit 0.
3. `npm run build` succeeds with routes `/`, `/signin`, `/onboarding`, `/parent`,
   `/child/latest`, `/api/generate-lesson`.
4. `node tests/full-flow.mjs` reports **25 PASS / 0 FAIL** with the dev server on :3000 and a
   working `GEMINI_API_KEY`.
