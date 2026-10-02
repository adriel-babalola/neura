# Neura
## Adaptive AI Tutor Engineered for Bandwidth-Constrained Learning

**Neura is a deep-tech educational platform solving a critical infrastructure problem: how to deliver personalized, interactive AI tutoring to students in low-connectivity environments without the data overhead of video-based education.**

---

## The Problem

**200 million students across Africa lack access to quality education.** In Nigeria specifically:
- 1 teacher per 50+ students in many classrooms
- Video-based digital education requires 5-15 MB per lesson (cost-prohibitive on ₦100-300/month data plans)
- Students often resort to rote memorization instead of concept mastery
- Personalized, one-on-one tutoring remains a privilege of wealthy families

**The infrastructure barrier is real:** interactive digital education has been built around video streaming, which is fundamentally incompatible with the connectivity reality of sub-Saharan Africa.

---

## The Solution: Semantic Streaming Architecture

Neura replaces data-heavy video lessons with a **bandwidth-optimized, semantics-first architecture**:

Instead of streaming rendered video frames → Neura transmits lightweight JSON tokens describing the lesson structure → the student's device reconstructs the interactive experience locally.

```
TRADITIONAL EDTECH:
Teacher → Recorded Video (5-15 MB) → Student Device

NEURA:
Teacher/AI → Semantic Lesson JSON (8-20 KB) → Student Device → Reconstructed Lesson
```

**Result:** ~99% reduction in data transfer compared to equivalent video lessons.

### Core Technical Innovations

#### 1. **Token-Budgeted AI Orchestration**
- Prompts are explicitly bounded and compressed to minimize token consumption
- Uses open-weight models (Gemma, Qwen) instead of proprietary APIs to avoid vendor lock-in
- Implements fallback routing across multiple model providers (OpenRouter primary, local deterministic engine secondary)
- Lesson structure validated against strict TypeScript schemas before transmission

#### 2. **Semantic Board Representation**
Instead of the AI generating raw text like "Draw a right triangle", Neura uses a structured schema:
```typescript
type BoardStroke = 
  | { kind: "equation", tex: "a² + b² = c²", emphasis: "highlight" }
  | { kind: "diagram", diagram: "right-triangle", labels: { hypotenuse: "c" } }
  | { kind: "callout", text: "Remember: the hypotenuse is always the longest side", tone: "hint" }
```

This semantic abstraction enables:
- Deterministic, on-device rendering (no re-computation needed)
- Mathematical accuracy (KaTeX handles all LaTeX rendering)
- Accessible narration (the system knows to say "c-squared" not "c2")
- Progressive enhancement (can be rendered on devices with no graphics support)

#### 3. **Client-Side Reconstruction Pipeline**
- **KaTeX + Framer Motion:** Mathematical equations and animations render locally using battle-tested libraries
- **Motion Primitives:** Smooth, performant animations on entry-level devices (not GPU-dependent)
- **Narration Queue:** Single-voice consistency; speech is queued and played sequentially to prevent overlap
- **Service Worker Caching:** Lessons can be cached for offline playback after initial download

#### 4. **Network-Agnostic Resilience**
- **Graceful Fallback:** If AI generation fails or network is unavailable, a deterministic fallback lesson engine returns a valid lesson structure immediately
- **Offline Shell:** Core UI loads without network; lessons fetch asynchronously
- **Retry Logic:** Exponential backoff for transient failures
- **Static Validation:** All lessons validated before rendering to prevent client-side crashes

#### 5. **Privacy-First Architecture**
- **Local Storage Only:** Student profiles, progress, and history stored in browser localStorage (never transmitted to servers)
- **Minimal Context Transmission:** Only age, subject, and struggle description sent to AI models — no child names, email, or identifying data
- **Future On-Device Inference:** Architecture designed to support local AI inference, making end-to-end learning possible without external servers

#### 6. **Adaptive Personalization**
- Each lesson is unique: generated based on the child's age, learning style, interests, and specific struggle
- Uses Socratic questioning (guided discovery) instead of direct instruction
- Progress history influences future lesson generation (adaptive loop)
- Adjusts difficulty and pacing based on student response patterns

---

## Technical Architecture

### Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) / React 19 / TypeScript |
| **AI Orchestration** | OpenRouter API (configurable) |
| **Math/Visuals** | KaTeX + Framer Motion |
| **Voice/TTS** | OpenRouter TTS + browser SpeechSynthesis fallback + Kokoro (local) |
| **Styling** | Tailwind CSS 4 |
| **Storage** | Browser localStorage (client-side only) |
| **Deployment** | Vercel (serverless) |

### Data Flow
```
1. Student inputs topic + describes struggle
   ↓
2. Parent onboarding captures: age, learning style, interests
   ↓
3. POST /api/generate-lesson with bounded request
   ↓
4. AI model generates semantic JSON (8-20 KB)
   ↓
5. Lesson normalized/validated against schema
   ↓
6. Client receives JSON; reconstructs experience locally
   ↓
7. Student reads/watches animated lesson + answers Socratic questions
   ↓
8. Progress + responses stored in browser (no server sync required)
```

### Key Files
| File | Purpose |
|------|---------|
| `src/app/api/generate-lesson/route.ts` | Validates request, calls AI model, returns lesson or fallback |
| `src/lib/lesson-generator.ts` | AI prompt engineering + JSON parsing |
| `src/lib/types.ts` | Strict TypeScript schemas for Lesson, Scene, Question, BoardStroke |
| `src/components/lesson-view.tsx` | Session player, narration orchestration |
| `src/components/AnimatedMathBoard.tsx` | KaTeX + Framer Motion renderer |
| `src/lib/fallback.ts` | Deterministic fallback lesson (works offline) |
| `src/lib/say.ts` | Speech orchestration + narrator voice consistency |

---

## What's Working Now (MVP)

✅ **Core Loop:**
- Student onboarding (captures age, interests, learning style)
- Adaptive lesson generation based on child profile + struggle
- Semantic JSON lesson structure (validated schemas)
- Animated chalkboard (KaTeX equations + Framer Motion)
- Narration with voice consistency
- Socratic questioning + answer validation
- Progress/streak tracking (localStorage)
- Fallback lesson for offline/failed-generation scenarios
- Multi-provider model orchestration (graceful degradation)

✅ **Deep-Tech Features:**
- Semantic board rendering (not raw text)
- Token-budgeted prompts
- Strict TypeScript validation
- Network-agnostic architecture
- Local-first data storage

---

## Roadmap (In Progress / Future)

🔄 **Current Focus:**
- Improving LaTeX-to-speech accuracy (prevent reading "a2" as "a two")
- Semantic board schema expansion (more diagram types, labels, callouts)
- Local Kokoro TTS production deployment
- Adaptive learner loop (storing history per student, using it in future lesson generation)
- Service worker offline caching

🚀 **Future Directions:**
- **On-Device Inference:** Support running open-weight models locally (WebGPU + ONNX)
- **In-Region Infrastructure:** Partner with telecom operators (like IHS Towers) to host models in-country
- **Expanded Curricula:** Beyond math to science, languages, vocational skills
- **Teacher Dashboard:** Analytics + insights for educators using Neura in classrooms
- **Offline-First Sync:** Lessons can be pre-loaded; progress syncs when connectivity returns

---

## Installation & Setup

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
git clone https://github.com/adriel-babalola/neura.git
cd neura
npm install
```

### Environment Variables
Copy `.env.example` to `.env.local`:
```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here  # Required for AI lesson generation
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Optional
```

Get a free OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys) (no credit card required).

### Development
```bash
npm run dev
# Open http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Quality
```bash
npm run typecheck   # Type checking
npm run lint        # Linting
npm run test        # Unit tests
```

---

## How to Use Neura

### For Parents/Educators
1. Visit the app and complete parent onboarding
2. Input your student's learning gap (e.g., "Struggling with fractions")
3. Describe the context (e.g., "Didn't understand the pizza-slicing example in class")
4. Hit "Generate Lesson"
5. Share the generated lesson with the student

### For Students
1. Complete child onboarding (age, favorite superhero/interest, learning style)
2. Choose a topic (math, science, language, etc.)
3. Read through the interactive story-based lesson
4. Answer Socratic questions (guided discovery, not quizzes)
5. Track mastery progress

---

## Why This Matters

### Problem Scale
- **200M students** across Africa lack personalized education
- **Video-based EdTech** is fundamentally incompatible with African connectivity
- **Teacher shortage** makes classroom personalization impossible at scale
- **Rote memorization** dominates despite poor learning outcomes

### Neura's Answer
Neura demonstrates that **bandwidth-optimized, semantics-first architecture** can deliver personalized AI tutoring at 1/100th the data cost of video. This makes interactive education accessible to students using ₦100-300/month data plans.

By using open-weight models and local rendering, Neura avoids vendor lock-in and creates a path toward fully on-device, in-region education infrastructure.

### Defensibility
- **Not a commodity wrapper:** Neura's deep-tech is the semantic lesson architecture + client-side reconstruction
- **Not easily copied:** Requires expertise in educational design, AI prompt engineering, mathematical rendering, and network optimization
- **Aligned with infrastructure partners:** IHS Towers, telecom operators, and regional servers can host this efficiently
- **Privacy-preserving:** No child data leaves the browser unless explicitly sent

---

## Team & Background

**Built by:** Adriel Babalola, full-stack engineer and founder at RIEL Studios

**Validation:**
- Backboard.io Prize Winner, CUTC Transform Hackathon 2026 (109 global submissions)
- Shipped multiple EdTech and hardware products (Athena, Idara)
- Mechatronics Engineering student, Federal University of Technology Minna

---

## License

MIT — Open source and freely available.

---

## Get Started

**Live Demo:** [neuraai-liard.vercel.app](https://neuraai-liard.vercel.app)

**GitHub:** [github.com/adriel-babalola/neura](https://github.com/adriel-babalola/neura)

**Questions?** [adrielbabalola@gmail.com](mailto:adrielbabalola@gmail.com)

---

## References

- Neal Stephenson, *The Diamond Age* — inspiration for adaptive learning
- Y Combinator RFS: [The Primer](https://www.ycombinator.com/rfs#the-primer)
- KaTeX: [katex.org](https://katex.org)
- Framer Motion: [framer.com/motion](https://framer.com/motion)