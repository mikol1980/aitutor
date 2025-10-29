# AI Tutor Matematyki (AI Math Tutor)

[![Status](https://img.shields.io/badge/status-MVP%20Development-yellow)](https://github.com)
[![Node Version](https://img.shields.io/badge/node-22.14.0-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

An intelligent educational application providing personalized mathematics tutoring for high school students preparing for the Polish basic-level matriculation exam (matura podstawowa). The product combines voice conversation with AI, mathematical visualizations, and an adaptive learning system to create an accessible and effective alternative to traditional tutoring.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

### The Problem

High school students preparing for the basic-level mathematics matriculation exam face several barriers:

- **High tutoring costs** (40-80 PLN/hour) with limited family budgets
- **Lack of time flexibility** in traditional tutoring
- **Knowledge gaps** (70% of students) from earlier grades
- **Fear of judgment** and asking questions in front of others
- **Lack of individual pace** in group classes

### The Solution

A web application (PWA) offering:

- 24/7 access to an AI math tutor with voice conversation
- Automatic adaptation to student level and needs
- Real-time mathematical visualizations (graphs, formulas, diagrams)
- Competitive pricing: 79-99 PLN/month for unlimited access
- First session free (30-45 minutes)

### Key Value Propositions

- **2-3x cheaper** than traditional tutoring
- **Available anytime, anywhere** - learn at your own pace
- **Personalized learning path** - adaptive AI adjusts to your level
- **No judgment zone** - safe space to ask any question
- **Active guidance** - AI proactively leads you through the material

## Tech Stack

### Frontend

- **Framework:** [Astro 5](https://astro.build/) - Modern static site generator with partial hydration
- **UI Library:** [React 19](https://react.dev/) - For interactive components
- **Language:** [TypeScript 5](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework
- **Component Library:** [Shadcn/ui](https://ui.shadcn.com/) - Re-usable components built with Radix UI
- **PWA:** Service Workers for offline capability
- **Math Rendering:** MathJax or KaTeX for LaTeX formulas
- **Visualizations:** TBD (Manim / p5.js / D3.js / Canvas)

### Backend

- **Platform:** [Supabase](https://supabase.com/)
  - PostgreSQL (database)
  - Auth (authentication)
  - Realtime (synchronization)
  - Edge Functions (API endpoints)
- **Language:** TypeScript / Python for ML/AI logic

### AI & Voice

- **LLM:** GPT-4, Claude 3.5 Sonnet, or Bielik (TBD - benchmark required)
- **STT (Speech-to-Text):** OpenAI Whisper API
- **TTS (Text-to-Speech):** ElevenLabs or OpenAI TTS
- **Prompt Engineering:** Custom system prompts for mathematics

### Infrastructure

- **Hosting:** Vercel (frontend) + Supabase (backend)
- **CDN:** Cloudflare
- **Analytics:** Mixpanel or Amplitude
- **Monitoring:** Sentry (error tracking)
- **Payment:** Stripe or PayU (Polish provider)

### DevOps

- **CI/CD:** GitHub Actions
- **Version Control:** Git + GitHub
- **Environment Management:** .env files + Vercel environment variables
- **Code Quality:** ESLint, Prettier, Husky, lint-staged

## Getting Started Locally

### Prerequisites

- **Node.js:** Version 22.14.0 (use nvm for version management)
- **npm:** Comes with Node.js
- **Supabase Account:** For backend services
- **API Keys:** OpenAI/Claude, Whisper, ElevenLabs (or OpenAI TTS)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-org/aitutor.git
cd aitutor
```

2. **Use the correct Node.js version**

```bash
nvm use
# or
nvm install 22.14.0
nvm use 22.14.0
```

3. **Install dependencies**

```bash
npm install
```

4. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Analytics (optional for development)
MIXPANEL_TOKEN=your_mixpanel_token

# Payment (optional for development)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

5. **Set up Supabase database**

```bash
# Run migrations (when available)
# supabase db push
```

6. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

### Development Workflow

- Make changes to files in `src/`
- Astro will hot-reload your changes automatically
- Run linting before committing: `npm run lint`
- Format code: `npm run format`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the development server with hot-reloading |
| `npm run build` | Builds the production-ready application |
| `npm run preview` | Previews the built application locally |
| `npm run astro` | Runs Astro CLI commands |
| `npm run lint` | Lints the codebase with ESLint |
| `npm run lint:fix` | Automatically fixes linting errors |
| `npm run format` | Formats code with Prettier |

## API Documentation

### REST API Endpoints

The application provides REST API endpoints for frontend-backend communication. All endpoints require authentication via JWT session cookies or Bearer token.

#### Implemented Endpoints

**Authentication & Profile**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/profile` - Get user profile

**Knowledge Structure**
- `GET /api/sections` - List all sections (subject areas) ordered by display order
- `GET /api/sections/{sectionId}` - Get details of a specific section
- `GET /api/sections/{sectionId}/topics` - List all topics within a section

**User Progress**
- `GET /api/user-progress` - Get user progress overview with optional filters ([docs](docs/api/user-progress-endpoint.md))

For complete API documentation, see [.ai/api-plan.md](.ai/api-plan.md).
For implementation status, see [.ai/api-implementation-status.md](.ai/api-implementation-status.md).

### Testing API Endpoints

Test scripts are provided for manual API testing:

```bash
# 1. Start the dev server
npm run dev

# 2. Login and extract JWT token from cookies/response

# 3. Run tests
./test-sections-endpoint.sh YOUR_JWT_TOKEN
./test-profile-endpoint.sh YOUR_JWT_TOKEN
```

**Available Test Scripts:**
- `test-sections-endpoint.sh` - Tests sections listing endpoint
- `test-profile-endpoint.sh` - Tests profile endpoint
- `test-session-endpoint.sh` - Tests session endpoints
- `test-user-progress-endpoint.sh` - Tests user progress endpoint with filters

## Project Scope

### Core Features (MVP)

#### F1: Voice Conversation with AI Tutor
- Push-to-talk mode (button to speak)
- Speech-to-Text: OpenAI Whisper
- Text-to-Speech: ElevenLabs or OpenAI TTS
- Fallback: text mode always available
- Maximum latency: 3-5 seconds (STT + LLM + TTS)
- Polish language support with youth slang

#### F2: Student Level Adaptation System
- **Diagnostic Test:** 15-20 minutes covering all math topics
- **Student Profile:** Competency levels per topic, learning history, weak points
- **Real-time Adaptation:** AI adjusts difficulty based on student responses

#### F3: Mathematical Visualizations
- Function graphs (linear, quadratic, exponential, trigonometric)
- Mathematical formulas (LaTeX rendering)
- Geometric diagrams (triangles, circles, polygons)
- Step-by-step solution illustrations

#### F4: Active Material Guidance
- AI proactively leads through the material
- Asks checking questions every 5-10 minutes
- Proposes exercises for independent solving
- Uses various explanation methods (analogies, real-life examples, visualizations)

#### F5: Content Scope - Basic Matriculation Exam
- Full scope of Polish basic-level matriculation exam (matura podstawowa)
- Supplementary module for foundational gaps
- Topics: Algebra, Geometry, Functions, Trigonometry, Combinatorics, Probability, Statistics

### Supporting Features (MVP)

#### F6: 3-Step Onboarding
1. Registration (email + password)
2. Introduction video (2 minutes, skippable)
3. Short conversation with AI (1-2 minutes)
4. Diagnostic test (15-20 minutes)
5. First free session (30-45 minutes)

#### F7: Feedback and Error Handling System
- "Report problem" button in every session
- AI admits uncertainty when not confident
- Expert verification queue (24h SLA)
- Post-session survey (1-5 stars + optional comment)

#### F8: Analytics and Tracking
- User registration, onboarding completion
- Session start/end, duration
- Voice vs text mode usage
- Visualization generation
- Problem reports and surveys
- Conversion to paid plan

### Out of Scope for MVP

The following features are planned for post-MVP releases:

- ❌ Student dashboard with progress visualization
- ❌ Continuous voice mode with VAD
- ❌ Gamification (points, achievements, streaks)
- ❌ Social features (leaderboards, groups)
- ❌ Photo upload of solutions (OCR)
- ❌ Multiple AI tutor personalities
- ❌ Native iOS/Android apps
- ❌ Parent monitoring module
- ❌ Integration with electronic grade books
- ❌ Downloadable materials (PDF, notes)

## Project Status

### Current Status

**Status:** MVP Development (Draft)  
**Version:** 0.0.1  
**Last Updated:** October 8, 2025

### Development Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| **Phase 0: Research & Planning** | 2 weeks | LLM benchmarking, visualization library research, legal review, infrastructure setup |
| **Phase 1: MVP Development** | 8 weeks | Core features implementation (4 sprints) |
| **Phase 2: Beta Testing** | 4 weeks | Testing with 20-50 users, feedback collection, iterations |
| **Phase 3: Iterations & Voice Features** | 8 weeks | Continuous voice mode, advanced features, content expansion |
| **Phase 4: Soft Launch** | 4 weeks | Launch for 100-200 users, scaling, marketing |

**Total to Soft Launch:** ~18 weeks (4.5 months)

### MVP Success Metrics (3 months)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Weekly retention | **40%+** | % of users returning after 7 days |
| Free → Paid conversion | **25%+** | % of users purchasing subscription |
| Average session rating | **4.0+** | 1-5 scale from survey |
| Paying users | **50+** | Number of active subscriptions |
| AI error reports | **<5%** | % of sessions with error report |

### Year 1 Goals (12 months)

- **MAU:** 1000+ monthly active users
- **Paying users:** 300+ (30% conversion)
- **MRR:** 25,000+ PLN
- **Additional tracks:** E8 exam, extended matriculation exam
- **Native apps:** iOS + Android

### Technology Decisions (TBD)

The following technical decisions require research in Phase 0:

1. **Visualization Library:** Manim vs p5.js vs MathJax+Canvas vs D3.js
2. **LLM Model:** GPT-4 vs Claude 3.5 Sonnet vs Bielik (benchmark required)
3. **Voice Problem Solving Mechanics:** User testing with 5-10 students
4. **API Caching Strategy:** Semantic cache implementation (Redis + embeddings)

## License

This project is proprietary software. All rights reserved.

For licensing inquiries, please contact: [contact@aitutor.pl](mailto:contact@aitutor.pl)

---

**Made with ❤️ for Polish students preparing for mathematics matriculation exam**

For more information, see [PRD.md](PRD.md) for detailed product requirements.
