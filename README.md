# Neura: Bandwidth-Optimized Semantic Streaming Engine

**Engineered for Resource-Constrained Education in Edge Networks**

## The Infrastructural Problem

High-fidelity digital education currently relies on video streaming (e.g., MP4, WebM). In many low-bandwidth regions, this overwhelms limited network capacity and creates a prohibitive financial barrier for students due to high mobile data costs.

## The Deep-Tech Solution (Vector-Over-Video)

Neura replaces data-heavy video streaming with a bandwidth-optimized, semantics-first architecture. Instead of streaming video frames, Neura transmits highly compressed structural JSON tokens over the network. These tokens are dynamically interpreted on the user's device to render interactive animations, diagrams and narration on-device, reducing data transfer compared to equivalent video-based instruction.

## Core Technical Innovations

- **Token-Budgeted AI Orchestration:** Leverages prompt compression and bounded token budgets to minimize payload size and latency over constrained networks.
- **Hybrid Speech Synthesis:** Uses a server-side expressive TTS route by default for consistent narration, with an in-browser speech fallback. The architecture is designed to support on-device Kokoro (WebGPU) for zero-cost offline narration.
- **Client-Side Vector Rendering:** Orchestrates mathematical and scientific visuals using KaTeX and motion primitives, prioritizing fluid execution on entry-level mobile devices.
- **Network-Agnostic Resilience:** Includes an offline-first shell, service worker caching and graceful fallbacks. If the AI route is unavailable or times out, a deterministic local fallback lesson engine ensures learning continues uninterrupted.
- **Privacy-First by Design:** Profiles, history, and progress are stored locally in the browser. Only minimised prompts are sent to configured AI providers; no child-identifying PII is required to be transmitted.
- **Consistent Single Narrator:** The lesson narrator is locked to a single voice profile per utterance to prevent identity switching mid-lesson, with strict one-utterance-at-a-time playback to avoid speech overlap.

## Tech Stack

- **Framework:** Next.js / React (TypeScript)
- **AI Orchestration:** OpenRouter (configurable)
- **Speech:** OpenRouter TTS with browser SpeechSynthesis fallback; Kokoro support is browser-side/capability-gated
- **Visual Engine:** Framer Motion & KaTeX
- **Styling:** Tailwind CSS
- **Storage:** Browser localStorage (client-side only)

## Local Setup & Installation

### Prerequisites

- Node.js 20+
- npm

### Installation

`ash
npm install
`

### Environment

Copy .env.example to .env.local and configure the required keys:

`ash
cp .env.example .env.local
`

Key variables:

- OPENROUTER_API_KEY (optional): Required for AI lesson generation and cloud TTS. If omitted, the app falls back to the local deterministic lesson engine.
- NEXT_PUBLIC_SITE_URL (optional)

### Development

`ash
npm run dev
`

### Build & Production

`ash
npm run build
npm start
`

### Quality Checks

`ash
npm run typecheck
npm run lint
npm run test
`

## Architecture Notes

Neura treats instruction as a stream of semantic operations (diagrams, equations, speech, prompts) rather than rendered video. This keeps payloads small, enables offline continuity, and preserves user privacy while remaining deployable on resource-constrained devices.