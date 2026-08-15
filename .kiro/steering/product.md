# Neura — Product

## What is Neura?
Neura is an adaptive Socratic AI tutor for children ages 6–13 (demo targets 8–12). Parents
describe what their child is struggling with; Neura generates a personalized lesson — a
self-writing chalkboard or a story — that stars the child's own interests and teaches through
questions, never lectures.

It is a **hackathon submission**. The core loop must feel like a working product to a judge,
even though there is no backend database and sign-in is simulated.

## Core user stories
1. A parent signs in (simulated), onboards their child (real, ~60s), and describes a struggle.
2. Neura (Gemini) generates a structured lesson around the child's age, interest, learning
   style, and frustration profile.
3. The child sees a chalkboard (or story) that writes itself, scene by scene.
4. When a question fires, the lesson pauses. The question is announced **out loud** (Web Speech
   API). The child types an answer; hints are Socratic (two attempts before a deeper clue).
5. Correct answers get confetti + spoken encouragement; the board continues.
6. The lesson ends with a reflection; the parent can return to the dashboard at any time.

## Non-negotiables
- **Child-safe:** structured generation only, no open-ended chatbot. All content comes from a
  schema-validated Gemini response with a strict safety system prompt.
- **Professional feel:** no emojis anywhere — lucide-react icons only. Minimal, spacious
  layout. No "vibe-coded" styling.
- **Landscape-friendly child view:** the lesson is an iPad-dashboard style split view
  (board + question rail), not a vertical phone scroll.
- **Voice:** child-facing prompts are spoken in a calm, low-pitch, slowed voice; a toggle in
  the lesson header controls it. Must work on iPad Safari (user-gesture priming).
- **Everything tested:** the Playwright suite (`tests/full-flow.mjs`) must stay green before
  any submission.

## Personas
- **Parent:** wants a working product impression in under 2 minutes. Sees onboarding, a build
  form, and a "parent view" of the child's experience.
- **Child:** wants a delightful, non-threatening lesson. Needs clear question cues, patience on
  wrong answers, and celebration on success.
- **Judge:** has never seen the app. The landing page + simulated sign-in must make the product
  feel real. `.env.local` must be configured with a working `GEMINI_API_KEY`.

## Constraints
- No real auth, no backend DB. All state is `localStorage` keys `neura:profile` and
  `neura:lesson`. Sign-in is simulated on `/signin`.
- Single Gemini model: `gemini-2.5-flash`. Must have a network key at demo time.
- Hackathon deadline; prefer small, dependency-free additions over new frameworks.
