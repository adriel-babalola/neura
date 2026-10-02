# Neura

An adaptive AI tutor that teaches children (ages 8-12) through interactive chalkboard lessons, Socratic questioning, and personalized storytelling.

## What it does

Parents describe what their child is struggling with. Neura generates a personalized lesson that:

- Breaks concepts into step-by-step scenes on an animated chalkboard
- Uses the child's interests to make abstract ideas concrete
- Asks questions at natural pause points (not quizzes, conversations)
- Shows common mistakes and why they happen
- Adapts language complexity to the child's age

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Math rendering**: KaTeX (LaTeX)
- **Animations**: Motion (Framer Motion)
- **AI**: OpenRouter API (free tier, Llama 3.3 70B)
- **Voice**: Server-proxied TTS (no client-side API keys)
- **Deployment**: Vercel

## Getting Started

```bash
git clone https://github.com/adriel-babalola/neura.git
cd neura
npm install
```

Create a `.env.local` file:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get a free key at [openrouter.ai/keys](https://openrouter.ai/keys) (no credit card required).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    signin/page.tsx       # Role selection (parent/student)
    onboarding/page.tsx   # Child profile setup
    parent/page.tsx       # Parent dashboard, lesson creation
    child/latest/page.tsx # Student lesson view
    api/
      generate-lesson/    # AI lesson generation endpoint
      tts/                # Narration proxy (tone-routed, private cache)
      edge-ai/            # Server-only short explanation proxy
  components/
    lesson-view.tsx       # Full lesson player with questions
    animated-math-board.tsx # Semantic SVG board from model-authored strokes
    offline-banner.tsx    # Connectivity status for children
  lib/
    lesson-generator.ts   # Provider chain with retries (server-only)
    lesson-json.ts        # Model chain, prompts, JSON parsing
    lesson-normalize.ts   # Repairs malformed model output
    openrouter-tts.ts     # Cloud narration (server-only)
    tts-voice.ts          # Tone -> model/voice routing
    audio-format.ts       # PCM -> WAV, chunk joining
    say.ts                # Voice orchestrator (cloud first, browser fallback)
    speech-text.ts        # LaTeX verbalisation and chunking
    api-client.ts         # Server-routed client, never holds a key
    types.ts              # TypeScript interfaces
    fallback.ts           # Offline fallback lesson
    edge-fallback.ts      # Normalized offline lesson
    history.ts            # Lesson history (localStorage, local dates)
    mastery.ts            # Aggregate learner model for adaptive prompts
```

## How Lessons Work

1. Parent fills in subject, struggle, and context
2. AI generates a structured lesson (5-8 scenes, 4-5 questions)
3. Each scene appears on an animated chalkboard with:
   - Text lines (with chalk styling and color coding)
   - LaTeX math (rendered by KaTeX)
   - A semantic board drawn as SVG strokes, not an image
   - Reading-hold timers so content stays visible
4. Questions pause the lesson and prompt the child
5. Hints guide reasoning without giving answers
6. Confetti and encouragement on correct answers
7. On finish, accuracy, hint usage, and duration are recorded locally

Narration is routed by scene tone: Gemini speaks the story, Voxtral speaks
the emotional beats. LaTeX is verbalised for speech and stripped from the
caption so the child never hears markup.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | Yes | Lesson generation **and** narration |
| `NEURA_LLM_BASE_URL` / `NEURA_LLM_API_KEY` | No | Self-hosted OpenAI-compatible backend |
| `GROQ_API_KEY` | No | Optional extra generation fallback |
| `GEMINI_API_KEY` | No | Optional extra generation fallback |
| `NEURA_TTS_MODE` | No | `auto` (default), `expressive`, `standard`, `budget` |

The API key is only read on the server. The browser calls `/api/*` and never
sees a key. Narration responses are `private, no-store`; repeat requests are
served from a short in-memory cache on the server.

See `.env.example` for the full list.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## License

MIT
