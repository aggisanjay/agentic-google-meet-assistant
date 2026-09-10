# 📅 Agentic Calendar Assistant

An intelligent, AI-powered meeting and calendar management assistant. It connects directly to your Google Calendar via Descope Outbound Applications, allowing an autonomous AI Agent powered by **Google Gemini** and **Mastra** to view, schedule, reschedule, and cancel meetings with automatic Google Meet links.

---

## 🛠 Exact Tech Stack

### Frontend
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication SDK**: [@descope/nextjs-sdk](https://www.descope.com/) (User sign-in, session management, OAuth)
- **Markdown & Streaming**: `react-markdown` & `remark-gfm` for real-time SSE streaming agent chat rendering
- **Component Primitives**: Tailwind UI + Class Variance Authority (`cva`), `clsx`, `tailwind-merge`

### Backend
- **Runtime & Server**: [Node.js](https://nodejs.org/) (ES Modules) with [Express 5](https://expressjs.com/)
- **Language**: TypeScript (`tsx` for dev watch & execution)
- **AI Agent Framework**: [@mastra/core](https://mastra.ai/) (Agent workflow orchestration, Tool execution, and memory management)
- **LLM / Model**: **Google Gemini** (`google/gemini-3.6-flash`) via Google Generative AI API
- **Agent Memory**: [@mastra/memory](https://mastra.ai/) & [@mastra/libsql](https://github.com/tursodatabase/libsql) (`mastra.db` for multi-turn working memory & conversation threads)
- **Auth & Token Management**: [@descope/node-sdk](https://www.descope.com/) (JWT validation, Outbound OAuth App token retrieval) & [@descope/mcp-express](https://www.descope.com/) (MCP Server mounting)
- **Database**: PostgreSQL (Hosted on [Neon](https://neon.tech/) or local Docker container) via `pg` (Node Postgres)
- **Google Integrations**: [googleapis](https://github.com/googleapis/google-api-nodejs-client) (Google Calendar v3 API)
- **Validation**: [Zod](https://zod.dev/) for type-safe tool schemas

---

## 🏛 Architecture Overview

```mermaid
graph TD
    User([User Browser])
    Frontend[Next.js 16 Frontend :3000]
    Backend[Express 5 Backend :4000]
    Descope[Descope Auth & Outbound Apps]
    Gemini[Google Gemini 3.6 Flash]
    GCalendar[Google Calendar v3 API]
    Database[(PostgreSQL Database)]
    Memory[(Mastra LibSQL DB)]

    User -->|Views UI & Chats| Frontend
    Frontend -->|Descope Auth Flow| Descope
    Frontend -->|Authenticated Requests Bearer Token| Backend
    Backend -->|Validates Session & Fetches User Tokens| Descope
    Backend -->|Stores Users & Connections| Database
    Backend -->|Manages Threads & Working Memory| Memory
    Backend -->|Executes Agent via Mastra| Gemini
    Gemini -->|Calls Function Tools| Backend
    Backend -->|Reads / Writes Calendar Events| GCalendar
```

---

## 🚀 Key Features

1. **Autonomous Scheduling & Conflict Detection**:
   - Checks user availability and busy windows via Google Calendar `freebusy` queries.
   - Schedules meetings and automatically generates Google Meet video conferencing links.
   - Reschedules or cancels existing calendar events.
2. **Context-Aware Multi-Turn AI Memory**:
   - Retains conversation threads and user meeting preferences across sessions using Mastra memory.
3. **Secure Zero-Password Calendar Integration**:
   - Uses Descope Outbound Applications to handle Google OAuth consent, refresh tokens, and scoped authorization securely without storing raw Google client credentials on the frontend.
4. **Real-Time Streaming Chat UI**:
   - Server-Sent Events (SSE) stream the agent's thought process, tool execution progress, and token stream in real-time.

---

## 📋 Environment Variables

### Backend (`backend/.env`)

```env
PORT=4000
APP_URL=http://localhost:3000

# PostgreSQL (Neon Cloud or Local Docker)
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

# Optional OpenAI Fallback
OPENAI_API_KEY=

# Descope MCP Server URL (Optional)
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
- [Node.js](https://nodejs.org/) (v20+ recommended)
- A PostgreSQL database (e.g. Free tier on [Neon.tech](https://neon.tech))
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

# Start the development server
npm run dev
```
Backend will start on `http://localhost:4000`. You can check `http://localhost:4000/health` to confirm the database is up.

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js dev server
npm run dev
```
Frontend will be available at `http://localhost:3000`.

---

## 🔐 Google Calendar OAuth Scopes Setup

In **Descope Console** -> **Outbound Applications** (`google-meet`):
Add the following Scopes:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

In **Google Cloud Console** -> **Credentials**:
Add the Authorized Redirect URI:
- `https://api.descope.com/v1/outbound/oauth/callback`

And enable the **Google Calendar API** in your Google Cloud project.

---

## 📁 Repository Structure

```
agentic-calendar-assistant/
├── README.md                      # Project documentation
├── docker-compose.yml             # Local PostgreSQL container config
│
├── backend/
│   ├── .env                       # Backend environment configuration
│   ├── package.json               # Backend dependencies & scripts
│   ├── sql/                       # SQL migrations (users, connections)
│   ├── scripts/
│   │   └── migrate.ts             # Migration runner script
│   └── src/
│       ├── config/                # Descope, Mastra memory, and agent prompt config
│       ├── db/                    # PostgreSQL connection pool
│       ├── mcp/                   # MCP server mounting
│       ├── middleware/            # Descope session auth middleware
│       ├── repositories/          # User and connection database access layers
│       ├── routes/                # Agent chat, connection, and health endpoints
│       └── services/              # Gemini agent, Calendar tools, and OAuth token services
│
└── frontend/
    ├── .env                       # Frontend environment configuration
    ├── package.json               # Frontend dependencies & scripts
    ├── next.config.ts             # Next.js configuration
    └── src/
        ├── app/                   # App Router pages (/sign-in, /dashboard, /)
        ├── components/            # UI components, Chat panel, Connection panel
        ├── lib/                   # API fetch utilities & agent client
        └── types/                 # TypeScript type definitions
```
