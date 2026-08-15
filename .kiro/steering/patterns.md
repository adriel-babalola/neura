# Neura — Patterns & Conventions

## State: localStorage stores must return stable snapshots
The app uses tiny external stores read with `useSyncExternalStore`. **Never `JSON.parse` inside
`readSnapshot` on every call** — a fresh object identity each render causes
"Maximum update depth exceeded" on every page. Cache by the raw localStorage string:

```ts
let cachedRaw: string | null = null;
let cached: Profile | null = null;

function readSnapshot(): Profile | null {
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cached;   // must be referentially stable
  cachedRaw = raw;
  cached = raw ? (JSON.parse(raw) as Profile) : null;
  return cached;
}
```

Writers update `cached`/`cachedRaw` and call every listener. See `profile.tsx` and
`lesson-store.ts`. This is invisible to `curl` — only a real browser catches it.

## Hydration: gate localStorage pages with `useMounted`
Pages that read `localStorage` during render mismatch the static prerender on a hard refresh.
The classic `useEffect`-based `useMounted` violates the React 19 rule
`react-hooks/set-state-in-effect`, so use the `useSyncExternalStore`-based hook in
`use-mounted.ts` and render `null` until mounted:

```tsx
const mounted = useMounted();
if (!mounted) return null;
```

Applied on `/child/latest`, `/onboarding`, `/parent`. `/` is safe (profile only used in event
handlers). `/signin` reads profile only inside the submit handler — safe.

## React 19 + ESLint
- `react-hooks/set-state-in-effect` is **enabled** — no synchronous `setState` in `useEffect`.
- Prefer `useCallback` for anything passed into effects/memoized children.

## Rough.js 4.x
`rc.rectangle()` / `rc.line()` return SVG nodes but are **not** attached. Always
`ref.current.appendChild(node)` inside a `useEffect`. The chalk frame SVG has
`data-blackboard` — use it as the CSS/query target for the board.

## Icons & emoji
- lucide-react only. **Never add emoji** — the app was explicitly de-emoji-fied.
- SVG presence tests must scope to `svg[data-blackboard]` (lucide icons are SVGs too).

## Speech (Web Speech API)
`src/lib/speech.ts`:
- Calm voice: `rate 0.92`, `pitch 1.06`, prefer `localService` English voices by name list.
- `speak()` cancels prior utterance; respects the `enabled` toggle; `stopSpeaking()` on mute.
- **iOS Safari blocks TTS until a user gesture** — prime with a volume-0 utterance inside the
  first `pointerdown` (`unlockSpeech()`), wired once in `LessonView`.
- Question arrival announces `"Here is a question for you." + prompt`; correct answers get
  `celebrate()` (confetti) + spoken praise; wrong attempts speak the hint. Track announced
  question ids in a ref to avoid re-announcing.

## Animations
- Entrance/presence: `motion/react`. **Do not transform (y/scale) elements that Playwright
  clicks immediately** — the test clicks `Try` right after filling the answer; a running
  transform makes the button "unstable" and the click races the disabled state. The question
  card therefore animates with opacity-only; the arrival signal is a pure box-shadow ring
  (`question-alert`), which doesn't affect layout.
- Ambient chalk dust: `ChalkDust` canvas, respects `prefers-reduced-motion`.
- Confetti: `disableForReducedMotion: true`.

## API contract (`POST /api/generate-lesson`)
- 400 malformed JSON, 400 missing `child.name`/`subject`/`struggle`, 405 other methods,
  503 missing `GEMINI_API_KEY`, 500 generation failure. Body `{ error, detail? }`.
- Server-side only: `gemini.ts` imports `"server-only"`.
- `thinkingConfig: { thinkingBudget: 0 }` + `responseJsonSchema`; responses are parsed and
  validated for `scenes`/`questions` before returning. Falls back to `fallback.ts` client-side
  only when a stored lesson is absent (offline demo).

## Lesson player rules (`lesson-view.tsx`)
- `pendingQuestion` = first unsolved question whose `sceneIndex` matches `sceneIndex`.
- `isPaused` while a question is pending — board auto-advance stops (`onLineDone` returns).
- Solving the last question of a scene advances after ~800ms; correct status shows ~1600ms.
- `LessonMode`: `"board"` → `Blackboard`; `"story"` → prose `StoryPage` (no chalkboard SVG).
- Progress = completed scenes / total. Header: sound toggle, scene counter, progress bar,
  "Parent view" button.

## Tests
- `node tests/full-flow.mjs` — must stay green (25 checks). Runs against `localhost:3000`,
  uses real Gemini (asserts lesson title != fallback title), validates question/scene payloads,
  checks hydration, Rough.js frame, KaTeX, no vertical overflow, solves all questions,
  Socratic wrong-answer path, story mode (0 `svg[data-blackboard]`), parent view.
- ESLint ignores `tests/**`, `scripts/**`. `.gitignore` covers `/tests`, `/.dev-screenshots`.
- Playwright needs `chromium-headless-shell` installed (`npx playwright install chromium-headless-shell`).

## Styling conventions
- Design tokens only via Tailwind theme classes (`text-ink`, `bg-surface`, …), never raw hex.
- Fonts: display = Plus Jakarta Sans, body = Inter.
- Layout: `flex`/`grid` with `min-h-0` on scroll containers; child view must never scroll
  vertically (`h-[100dvh]` + overflow-hidden rails).
