# Neura.

**An adaptive Socratic AI tutor for kids 6–12.** Neura learns who your child is — their
interests, how they learn, when they get stuck — then teaches through chalkboards,
conversations, and stories they actually love.

Built for a hackathon demo. Inspired by The Primer (Y Combinator RFS). **No emojis, no
vibe-coded UI — a minimal, professional product surface.**

---

## Highlights

- **Adaptive lessons on demand** — a parent names a struggle (e.g. "can't add fractions") and
  Gemini (`gemini-2.5-flash`) writes a personalized lesson around the child's age, interests,
  and learning style.
- **Two modes** — a self-writing **chalkboard** (Rough.js + KaTeX math) or a **story** starring
  the child's favorite interest.
- **Socratic, never preachy** — lessons pause at questions; two gentle hint stages; loose
  answer matching.
- **Child-safe voice** — Web Speech API announces questions and feedback in a calm, slowed
  voice (works on iPad Safari); toggle in the lesson header.
- **Delight without distraction** — correct answers get confetti; chalk-dust ambient
  animation on the board; a pulsing ring signals when a question is waiting.
- **Landscape dashboard** for kids — board on the left, question rail on the right. Zero
  vertical scrolling on iPad.
- **Safe by design** — structured JSON schema generation, strict child-safety system prompt,
  no open-ended chatbot.

## Quickstart

```bash
npm install

# configure Gemini (required for lesson generation)
echo "GEMINI_API_KEY=your_key_here" > .env.local

npm run dev        # http://localhost:3000
```

Then open the app, **Get started → Sign in** (simulated — choose "I'm a parent", type any
name), complete the 4-step onboarding, and build a lesson.

> Sign-in is **simulated** on purpose: no backend database. All state lives in
> `localStorage` (`neura:profile`, `neura:lesson`).

## Testing

```bash
npx playwright install chromium-headless-shell   # once
node tests/full-flow.mjs                         # 25 checks against :3000
```

The suite drives the real product: onboarding, a real Gemini lesson, chalkboard/KaTeX/voice
surfaces, solving every question, the Socratic wrong-answer path, story mode, hydration
safety, and a zero-client-error guarantee. Screenshots land in `.dev-screenshots/`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · motion · lucide-react ·
KaTeX + Rough.js · canvas-confetti · Web Speech API · Playwright

See `.kiro/` for full agent-readable docs (product, tech, structure, patterns, specs).

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/signin` | Simulated sign-in (role select) |
| `/onboarding` | 4-step parent/child profile wizard |
| `/parent` | Build-a-lesson dashboard |
| `/child/latest` | The lesson player (board/story) |
| `POST /api/generate-lesson` | Gemini lesson generation |

## License

Demo project — all yours.
# neura
