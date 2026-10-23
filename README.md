# 📅 Agentic Google Meet & Calendar Assistant

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Express 5](https://img.shields.io/badge/Express-5.2-lightgrey?logo=express)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-3.6_Flash-orange?logo=google)](https://aistudio.google.com/)
[![Mastra Agent](https://img.shields.io/badge/Mastra-Core_v1.59-purple)](https://mastra.ai/)
[![Descope Auth](https://img.shields.io/badge/Descope-Outbound_OAuth-success)](https://www.descope.com/)
[![Evaluation Suite](https://img.shields.io/badge/Evals-15%2F15_Passed_(100%25)-brightgreen)](file:///c:/Users/aggis/Desktop/agentic-google-meet-assistant/backend/evals/results.json)
[![Unit Tests](https://img.shields.io/badge/Tests-12%2F12_Passed_(100%25)-brightgreen)](file:///c:/Users/aggis/Desktop/agentic-google-meet-assistant/backend/tests)

An enterprise-ready, autonomous AI calendar assistant that connects directly to Google Calendar and Google Meet via **Descope Outbound Applications**. Powered by **Google Gemini** and **Mastra**, it intelligently views, schedules, reschedules, and cancels meetings with automatic Google Meet video conferencing, strict conflict detection, deterministic source provenance, and two-phase user confirmation for write actions.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Key Features & Innovations](#-key-features--innovations)
- [Tech Stack](#-tech-stack)
- [Evaluation Suite & Verification Benchmarks](#-evaluation-suite--verification-benchmarks)
- [Repository Structure](#-repository-structure)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [API Reference](#-api-reference)
- [Security & Isolation Model](#-security--isolation-model)
- [Documentation & Audit Reports](#-documentation--audit-reports)

---

## 🏛 Architectural Overview

The system bridges conversational natural language with deterministic Google Calendar actions, isolating untrusted user input and external calendar metadata with cryptographic safety boundaries:

```mermaid
graph TD
    User([User Browser])
    Frontend[Next.js 16 Frontend :3000]
    Backend[Express 5 Backend :4000]
    Descope[Descope Auth & Outbound Apps]
    Gemini[Google Gemini 3.6 Flash / Fallback]
    GCalendar[Google Calendar v3 API]
    Database[(PostgreSQL Database)]
    Memory[(Mastra LibSQL DB)]
    Telemetry[Telemetry & Cost Monitor]

    User -->|Views UI & Streams Chat| Frontend
    Frontend -->|Descope Auth Flow| Descope
    Frontend -->|Authenticated Requests Bearer JWT| Backend
    Backend -->|Cryptographically Validates Session| Descope
    Backend -->|Derives Auth User Identity| Database
    Backend -->|Enforces Thread Isolation & History| Memory
    Backend -->|Executes Autonomous Agent Workflow| Gemini
    Gemini -->|Invokes Schema-Validated Tools| Backend
    Backend -->|Fetches Scoped OAuth Token| Descope
    Backend -->|Executes FreeBusy / Events API| GCalendar
    Backend -->|Attaches Typed Source Provenance| Telemetry
    Backend -->|Streams SSE Events with Provenance & Metrics| Frontend
```

### End-to-End Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Next.js 16 App Router
    participant Auth as Descope API
    participant Server as Express 5 Backend
    participant Agent as Mastra Agent / Gemini
    participant Cal as Google Calendar API

    User->>Frontend: Send message ("Schedule 1:1 with Bob tomorrow at 3pm")
    Frontend->>Auth: Retrieve valid session JWT
    Frontend->>Server: POST /api/agent/chat (Bearer JWT, threadId, message, timezone)
    Server->>Auth: Validate JWT session & claims (cryptographic check)
    Server->>Server: Isolate thread ownership & sanitize untrusted inputs
    Server->>Agent: Prompt agent with user timezone & calendar tools
    Agent->>Server: Call tool: checkCalendarBusy / createMeeting
    Server->>Auth: Fetch user's Google Calendar OAuth token (Outbound App)
    Server->>Cal: Execute freebusy query or verify existing events
    Cal-->>Server: Return calendar state
    Server->>Server: Attach SourceProvenance metadata & track telemetry
    Server-->>Agent: Structured tool result + provenance facts
    Server-->>Frontend: SSE Stream (tool_call, confirmation_card, token, provenance, done)
    Frontend-->>User: Render live text, confirmation card, and provenance pills
```

---

## 🚀 Key Features & Innovations

### 1. Autonomous Scheduling & Google Meet Creation
- **Free/Busy Conflict Detection**: Automatically queries Google Calendar free/busy slots before scheduling to prevent double-booking.
- **Instant Google Meet Links**: Creates Google Calendar events with built-in Google Meet video conferencing (`conferenceData.createRequest`).
- **Rescheduling & Safe Cancellation**: Modifies existing events with ID verification and sanity checks.

### 2. Deterministic Source Provenance & Verification
Every scheduling response and calendar operation emits typed `SourceProvenance` metadata (`calendar_api`, `freebusy_api`, `user_instruction`, `calculated`, `inferred`):
- Provides exact timestamps, event IDs, query ranges, and conflict counts.
- Verifies post-write state directly with Google Calendar before confirming success.
- Rendered in the UI as clickable "Verified via Google Calendar" provenance pills.

### 3. Two-Phase Safe Write Actions & Confirmation Cards
- Destructive or consequential actions (creating, rescheduling, or canceling meetings) trigger interactive **Confirmation Cards** in the chat panel.
- Displays full proposal details: Title, Start/End times, Timezone, Attendee list, and detected conflicts.
- Requires explicit user approval (`Confirm` / `Cancel`) before executing write mutations.

### 4. Advanced Timezone Engine
- Full **IANA Timezone resolution** (`America/New_York`, `Europe/London`, `Asia/Kolkata`, `UTC`).
- Eliminates server-timezone pollution when calculating day boundaries (`todayOnly=true`).
- Handles Daylight Saving Time (DST) transitions and ambiguous relative dates (e.g. "tomorrow morning").

### 5. Cost & Latency Observability
- Real-time telemetry tracking request duration, time-to-first-token (TTFT), model latency, and tool execution time.
- Token consumption tracking (prompt tokens, completion tokens, cached tokens).
- Dynamic cost calculation using versioned pricing tables (`2026-10-v1`) for Gemini and fallback models.

### 6. Robust Prompt-Injection & Boundary Safeguards
- External calendar descriptions and attendees are quarantined inside untrusted boundary markers.
- Model safety policies prevent embedded calendar payload instructions from hijacking agent goals or triggering unauthorized actions.
- Per-user thread ownership enforcement preventing cross-user conversation access.

### 7. Interactive Landing Page Agent Simulator
- High-fidelity interactive simulator showcasing live agent scheduling, meeting creation, and tool execution directly on the public landing page.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: [@descope/nextjs-sdk](https://www.descope.com/)
- **Markdown & Streaming**: `react-markdown` & `remark-gfm` for real-time SSE stream rendering
- **UI Primitives**: Tailwind UI + Class Variance Authority (`cva`), `clsx`, `tailwind-merge`

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules) with [Express 5](https://expressjs.com/)
- **Language**: TypeScript (`tsx` for dev watch & execution)
- **Agent Framework**: [@mastra/core](https://mastra.ai/) (Workflow orchestration & Tool schemas)
- **LLM / AI Model**: **Google Gemini** (`google/gemini-3.6-flash`, `google/gemini-3.5-flash`) via Google Generative AI API with automatic multi-provider fallback
- **Agent Memory**: [@mastra/memory](https://mastra.ai/) & [@mastra/libsql](https://github.com/tursodatabase/libsql)
- **Auth & Tokens**: [@descope/node-sdk](https://www.descope.com/) & [@descope/mcp-express](https://www.descope.com/)
- **Database**: PostgreSQL (Hosted on [Neon](https://neon.tech/) or local Docker) via `pg`
- **Calendar API**: [googleapis](https://github.com/googleapis/google-api-nodejs-client) (Google Calendar v3)
- **Validation**: [Zod](https://zod.dev/) schemas with strict ISO-8601 validation
- **Testing**: [Vitest](https://vitest.dev/) unit/integration test runner

---

## 📊 Evaluation Suite & Verification Benchmarks

The repository includes a dedicated 15-scenario evaluation dataset ([`backend/evals/dataset.json`](file:///c:/Users/aggis/Desktop/agentic-google-meet-assistant/backend/evals/dataset.json)) and automated runner ([`backend/evals/runner.ts`](file:///c:/Users/aggis/Desktop/agentic-google-meet-assistant/backend/evals/runner.ts)) covering task quality, conflict resolution, multi-timezone handling, prompt injection defense, and authorization gates.

### Latest Benchmark Results ([`results.json`](file:///c:/Users/aggis/Desktop/agentic-google-meet-assistant/backend/evals/results.json))

| Metric | Target | Achieved Result | Status |
| :--- | :---: | :---: | :---: |
| **Total Scenarios Passed** | 15 / 15 | **15 / 15 (100%)** | ✅ Passed |
| **Task Completion Rate** | $\ge 90\%$ | **100.0%** | ✅ Passed |
| **Safety Score** | $100\%$ | **100.0%** | ✅ Passed |
| **Prompt Injection Bypass Rate** | $0\%$ | **0.0%** | ✅ Passed |
| **Unauthorized Write Rate** | $0\%$ | **0.0%** | ✅ Passed |
| **Provenance Compliance Rate** | $100\%$ | **100.0%** | ✅ Passed |
| **Conflict Detection Accuracy** | $\ge 95\%$ | **100.0%** | ✅ Passed |
| **Tool Selection Accuracy** | $\ge 85\%$ | **87.5%** | ✅ Passed |
| **Median Duration** | $< 500\text{ms}$ | **0 ms** | ✅ Passed |
| **P95 Latency** | $< 1000\text{ms}$ | **190 ms** | ✅ Passed |

### Covered Scenarios:
1. `scenario-01-create-meeting`: Team sync meeting creation with attendee validation and duration check.
2. `scenario-02-reschedule-meeting`: Reschedule existing meeting ID to a new time window.
3. `scenario-03-cancel-meeting`: Safe event cancellation after verifying existence.
4. `scenario-04-find-available-time`: Free availability search using `checkCalendarBusy`.
5. `scenario-05-detect-conflict`: Automatic overlap detection and rejection of double-bookings.
6. `scenario-06-timezone-tokyo`: Cross-border scheduling in `Asia/Tokyo` timezone.
7. `scenario-07-timezone-london`: Cross-border scheduling in `Europe/London` timezone.
8. `scenario-08-ambiguous-relative-time`: Disambiguation of relative phrases ("early afternoon").
9. `scenario-09-prompt-injection-drop-database`: Rejection of injected malicious instructions.
10. `scenario-10-prompt-injection-calendar-description`: Neutralization of untrusted calendar descriptions.
11. `scenario-11-unauthorized-other-user`: Blocking access to another user's calendar/thread.
12. `scenario-12-list-upcoming`: Listing upcoming meetings with timezone-bounded filtering.
13. `scenario-13-quick-reschedule-by-title`: Finding and updating meetings by title search.
14. `scenario-14-back-to-back-meetings`: Tight scheduling between existing meetings.
15. `scenario-15-multi-attendee-invite`: Multi-attendee scheduling with Google Meet conferencing.

---

## 📁 Repository Structure

```
agentic-google-meet-assistant/
├── README.md                      # Project documentation & benchmark report
├── docker-compose.yml             # Local PostgreSQL container config
│
├── docs/                          # Architectural & Audit Specifications
│   ├── architecture.md            # Comprehensive system & sequence design
│   ├── audit-report.md            # Full security, tool, & build audit findings
│   └── improvement-plan.md        # 9-phase production upgrade plan
│
├── backend/                       # Express 5 + TypeScript Backend Service
│   ├── .env                       # Backend environment configuration
│   ├── package.json               # Backend dependencies & test scripts
│   ├── tsconfig.json              # TypeScript compilation config
│   ├── evals/                     # Agent Evaluation Suite
│   │   ├── dataset.json           # 15 scenario test definitions
│   │   ├── results.json           # Benchmark execution outputs & metrics
│   │   └── runner.ts              # Evaluation harness runner
│   ├── tests/                     # Vitest Unit & Integration Tests
│   │   ├── auth.test.ts           # Descope authentication & session tests
│   │   ├── evals.test.ts          # Dataset validity & schema assertions
│   │   └── timezone.test.ts       # IANA timezone & date calculation tests
│   ├── sql/                       # SQL migrations schema
│   │   └── 001_initial_schema.sql # users and connections schema
│   ├── scripts/
│   │   └── migrate.ts             # Migration runner script
│   └── src/
│       ├── config/                # Descope, Mastra memory, & agent prompts
│       ├── db/                    # PostgreSQL connection pool (`pool.ts`)
│       ├── mcp/                   # Model Context Protocol tools (`calendar-tools.ts`)
│       ├── middleware/            # Descope session auth & user hydration
│       ├── repositories/          # User & connection data access layers
│       ├── routes/                # Agent chat, connection, & health routes
│       ├── services/              # Calendar, token, telemetry, & agent services
│       │   ├── agent.service.ts       # Mastra agent invocation & thread isolation
│       │   ├── agent-tools.service.ts # Zod-validated calendar tool schemas
│       │   ├── calendar.service.ts    # Google Calendar v3 API operations
│       │   ├── telemetry.service.ts   # Latency, token usage, & cost tracking
│       │   └── token.service.ts       # Descope outbound OAuth token client
│       ├── types/                 # Typed Provenance schemas
│       │   └── provenance.ts      # SourceProvenance, CalendarEventItem definitions
│       └── utils/                 # Timezone engine
│           └── timezone.ts        # IANA normalization, UTC conversion, day bounds
│
└── frontend/                      # Next.js 16 + React 19 Frontend App
    ├── .env                       # Frontend environment configuration
    ├── package.json               # Frontend dependencies & scripts
    ├── next.config.ts             # Next.js configuration
    ├── postcss.config.mjs         # PostCSS configuration for Tailwind CSS v4
    └── src/
        ├── app/                   # App Router pages (/sign-in, /dashboard, /)
        ├── components/
        │   ├── auth/              # Descope authentication wrapper
        │   ├── dashboard/         # Dashboard layout, Chat panel, & Connection panel
        │   │   ├── chat-panel.tsx       # Real-time SSE chat, confirmations, provenance
        │   │   ├── connection-panel.tsx # Google Calendar OAuth status & connect button
        │   │   └── markdown-message.tsx # Markdown renderer with code highlighting
        │   ├── landing/           # Landing page hero, features, & simulator
        │   │   ├── agent-simulator.tsx   # Interactive agent simulator widget
        │   │   └── landing-image-slot.tsx
        │   └── ui/                # Reusable UI primitives (Button, Card, Badge, etc.)
        ├── lib/                   # API utilities & streaming SSE client (`agent.ts`)
        └── types/                 # Frontend TypeScript interfaces
```

---

## 📋 Environment Variables

### Backend (`backend/.env`)

```env
# Server Port & Allowed Origins
PORT=4000
APP_URL=http://localhost:3000

# PostgreSQL Database (Neon Cloud or Local Docker)
DATABASE_URL=postgresql://username:password@ep-something.aws.neon.tech/neondb?sslmode=require

# Descope Authentication & Outbound Application
DESCOPE_PROJECT_ID=your_descope_project_id
DESCOPE_MANAGEMENT_KEY=your_descope_management_key
DESCOPE_CALENDAR_CONNECTION_ID=google-meet

# AI Model Configuration (Google Gemini)
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=google/gemini-3.6-flash

# Optional Fallback Model Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Optional Descope MCP Server
SERVER_URL=http://localhost:4000
DESCOPE_MCP_SERVER_WELL_KNOWN_URL=https://api.descope.com/v1/apps/agentic/.../.well-known/openid-configuration
```

### Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_descope_project_id
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🏁 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+ LTS recommended)
- A PostgreSQL database (free tier on [Neon.tech](https://neon.tech) or local Docker)
- A [Descope](https://app.descope.com) account (with Project ID & Outbound App configured)
- A [Google AI Studio Gemini API Key](https://aistudio.google.com/)

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

The backend starts on `http://localhost:4000`. Test the health check endpoint:
```bash
curl http://localhost:4000/health
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server with Turbopack
npm run dev
```

The frontend will be live at `http://localhost:3000`.

---

## 🧪 Testing & Quality Assurance

### Run Unit & Integration Tests (Vitest)
```bash
cd backend
npm test
```
Runs 12 unit tests verifying:
- JWT session validation and missing header rejections.
- IANA timezone normalization, offset parsing, and date calculation accuracy.
- Evaluation dataset integrity, scenario coverage, and schema conformity.

### Run Automated Evaluation Suite
```bash
cd backend
npm run eval
```
Executes the full 15-scenario agent evaluation harness, measuring tool selection, safety guardrails, prompt injection neutralization, and writes benchmark metrics to `evals/results.json`.

### Build Verification
```bash
# Validate Backend TypeScript
cd backend
npm run build

# Validate Frontend Next.js Build
cd frontend
npm run build
```

---

## 🔌 API Reference

### Agent Routes (`/api/agent`)
- `POST /api/agent/chat` (Protected)
  - Initiates Server-Sent Events (SSE) stream for agent interaction.
  - Headers: `Authorization: Bearer <session-token>`
  - Body: `{ threadId?: string, message: string, timezone?: string }`
  - Stream Events: `started`, `progress`, `tool_call`, `confirmation`, `token`, `provenance`, `telemetry`, `done`, `error`.
- `GET /api/agent/threads` (Protected)
  - Lists all conversation threads belonging to the authenticated user.
- `GET /api/agent/threads/:threadId` (Protected)
  - Retrieves chat message history for a specific thread with ownership verification.
- `DELETE /api/agent/threads/:threadId` (Protected)
  - Deletes conversation thread history.

### Connection Routes (`/api/connections`)
- `GET /api/connections/status` (Protected)
  - Checks if user has an active Google Calendar OAuth connection.
- `GET /api/connections/url` (Protected)
  - Generates Descope Outbound OAuth authorization URL for Google Calendar.
- `DELETE /api/connections` (Protected)
  - Disconnects user's calendar connection.

### System
- `GET /health`
  - Returns backend status, uptime, and database connectivity.

---

## 🔐 Security & Isolation Model

1. **Cryptographic Identity Derivation**: All operations (calendar actions, thread history, DB records) derive identity exclusively from verified Descope JWT claims (`sub`). No client-supplied user identifiers are accepted.
2. **Untrusted Boundary Quarantining**: External calendar summaries, attendee names, and event descriptions are wrapped in strict delimiters (`<<<UNTRUSTED_CONTENT>>>`) to prevent prompt-injection attacks.
3. **Thread Ownership Enforcement**: Users cannot query or mutate threads belonging to other users. Attempted cross-user access triggers an immediate 404/403.
4. **Least-Privilege Token Life Cycle**: Google Calendar OAuth tokens are fetched ephemerally per action via Descope Outbound App Management APIs and are never exposed to the frontend or persisted in client-side storage.

---

## 📚 Documentation & Audit Reports

- 🏗️ [Architecture Specification](file:///c:/Users/aggis/Desktop/agentic-google-meet-assistant/docs/architecture.md) — Comprehensive technical architecture, topology, and sequence diagrams.
- 🔍 [Audit Report](file:///c:/Users/aggis/Desktop/agentic-google-meet-assistant/docs/audit-report.md) — Exhaustive finding-by-finding audit of builds, security, calendar tools, and prompt injection defense.
- 📋 [Improvement Plan](file:///c:/Users/aggis/Desktop/agentic-google-meet-assistant/docs/improvement-plan.md) — 9-phase enterprise production roadmap and verification checklist.

---

## 📄 License

MIT License. Designed and maintained for modern agentic workflows.
