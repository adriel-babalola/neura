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
      tts/                # Text-to-speech proxy (free, no key)
  components/
    blackboard.tsx        # Animated chalkboard with KaTeX math
    lesson-view.tsx       # Full lesson player with questions
    chalk-dust.tsx        # Particle effect overlay
  lib/
    gemini.ts             # AI lesson generation (OpenRouter/Groq)
    say.ts                # Voice orchestrator
    speech.ts             # Browser speechSynthesis wrapper
    tts.ts                # Remote TTS client
    types.ts              # TypeScript interfaces
    fallback.ts           # Offline fallback lesson
    history.ts            # Lesson history (localStorage)
```

## How Lessons Work

1. Parent fills in subject, struggle, and context
2. AI generates a structured lesson (5-8 scenes, 4-5 questions)
3. Each scene appears on an animated chalkboard with:
   - Text lines (with chalk styling and color coding)
   - LaTeX math (rendered by KaTeX)
   - Reading-hold timers so content stays visible
4. Questions pause the lesson and prompt the child
5. Hints guide reasoning without giving answers
6. Confetti and encouragement on correct answers

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | Yes | AI lesson generation (free at openrouter.ai) |
| `GROQ_API_KEY` | Optional | Backup AI provider |

Voice/TTS requires no API key. It uses a server-side proxy.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## License

MIT
