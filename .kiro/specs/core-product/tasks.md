# Tasks — Core product

## Done (do not re-implement)
- [x] Research: Web Speech API (built-in, iPad-safe) + canvas-confetti + custom chalk-dust canvas
      (tsParticles rejected as too heavy). lucide-react chosen as the icon set.
- [x] `src/lib/speech.ts` — calm voice wrapper (rate 0.92 / pitch 1.06, localService preference,
      cancel-on-speak, enable toggle, iOS gesture priming).
- [x] `src/components/chalk-dust.tsx` — ~40-line canvas, dpr-aware, reduced-motion aware.
- [x] `/` landing page with features/steps/footer; `/signin` simulated auth.
- [x] Landscape dashboard `LessonView`: header (sound toggle, progress, parent view), split
      board + question rail, question arrival ring + spoken signal, confetti on correct,
      spoken hints, `data-blackboard` marker.
- [x] De-emoji-fied onboarding + parent dashboard (lucide icons).
- [x] Playwright suite updated (scoped SVG checks) → **25/25 PASS**.
- [x] typegen + tsc + lint + build all clean.

## Open / candidate next steps (for a continuation agent — none required for submission)
- [ ] Persist the sound toggle in `localStorage` (currently session-only).
- [ ] Add a "try the demo" sample-lesson button on `/` that seeds `fallback.ts` and jumps
      straight to `/child/latest` (judge shortcut).
- [ ] Add a "New lesson" affordance inside the lesson player (currently via Parent view).
- [ ] Keyboard/screen-reader polish on the question rail (aria-live for question announcements).
- [ ] Slight wording pass on the Gemini system prompt to reduce `2/3 + 1/2`-style answer leakage
      (Socratic purity) — keep `tests/full-flow.mjs` green.
- [ ] Prefetch/visual refresh for `/signin` → onboarding when profile exists.

## Guardrails for any change
1. Never break: 25/25 test suite, hydration-safety, snapshot-stability of the two stores.
2. No emojis, no heavy deps, no vertical scroll in `/child/latest`.
3. Run: `next typegen`, `tsc --noEmit`, `lint`, `build`, `node tests/full-flow.mjs`.
