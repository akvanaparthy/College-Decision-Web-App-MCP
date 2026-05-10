# College Decision Companion

> **InMarket Challenge — AI Builder Candidate Project**
> An end-to-end agentic web app that helps prospective U.S. college students cut through the noise of college selection.

A conversational research assistant. Ask questions like:

- *"Find me bachelor's-degree colleges in California under $30k net price with at least an 80% graduation rate."*
- *"Compare UCLA and UC Berkeley side by side."*
- *"What is the median earnings 10 years after entry for University of Michigan-Ann Arbor graduates?"*

An LLM agent (LangChain.js + OpenRouter Nemotron-3) decides which of four tools to call against a College Scorecard MCP-style microservice wrapper, then renders structured results as cards, ranked lists, and side-by-side comparison tables — never raw JSON.

---

## Architecture

```
┌──────────────┐  HTTP   ┌────────────────────┐  HTTP   ┌──────────────────────┐  HTTPS  ┌──────────────────┐
│  Frontend    │ ──────▶ │ Agent Backend      │ ──────▶ │  MCP Wrapper         │ ──────▶ │  College         │
│  Vite/React  │  :5173  │ Express +          │  :4100  │  Express + Zod       │  :4000  │  Scorecard       │
│  Tailwind    │         │ LangChain.js +     │         │                      │         │  (api.data.gov)  │
│              │         │ Nemotron-3         │         │                      │         │                  │
└──────────────┘         └────────────────────┘         └──────────────────────┘         └──────────────────┘
   no secrets               OPENROUTER_API_KEY              SCORECARD_API_KEY                      —
```

Three services, three folders, three `package.json` files. Two API keys, each isolated to its service. Frontend has zero secrets. The MCP wrapper is the **only** place `SCORECARD_API_KEY` lives; the agent service is the **only** place `OPENROUTER_API_KEY` lives.

Detailed phased build plan: [`implementation.md`](./implementation.md).
Full agentic-IDE conversation log: [`chattranscript.html`](./chattranscript.html).

---

## Prerequisites

- **Node.js 20.x or newer** (`node --version` to check)
- **npm 10.x or newer** (ships with Node 20)
- A modern browser (Chrome, Firefox, Edge, Safari)

---

## Getting API keys (both free)

### 1. College Scorecard (`SCORECARD_API_KEY`)

The Scorecard data is a public good but the api.data.gov gateway requires a free key for rate-limit attribution.

1. Visit **https://api.data.gov/signup/**
2. Fill in the short form (name + email — no credit card)
3. The key is emailed within seconds

### 2. OpenRouter (`OPENROUTER_API_KEY`)

OpenRouter exposes the free-tier `nvidia/nemotron-3-super-120b-a12b:free` model used by this project.

1. Visit **https://openrouter.ai/** and sign in (Google/GitHub)
2. Go to **Keys** → **Create Key**
3. Name it (e.g., "College Companion") and copy the `sk-or-v1-...` token

Free-tier daily limits are sufficient for development and demo recording.

---

## Setup

```sh
git clone <this-repo>
cd "InMarket Challenge"
```

Create three `.env` files from the committed examples and fill in your keys.

### `mcp-wrapper/.env`
```
SCORECARD_API_KEY=<your_api_data_gov_key>
MCP_WRAPPER_PORT=4000
LOG_LEVEL=info
```

### `agent/.env`
```
OPENROUTER_API_KEY=<your_openrouter_key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.3-70b-instruct:free
MCP_BASE_URL=http://localhost:4000
AGENT_PORT=4100
AGENT_CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### `frontend/.env`
```
VITE_AGENT_URL=http://localhost:4100
```

> **Important**: never commit any `.env` file. Only the `.env.example` files are tracked. `.env` is in `.gitignore`.

---

## Running locally

Open **three terminals** (or use a process manager like `concurrently`):

### Terminal 1 — MCP wrapper
```sh
cd mcp-wrapper
npm install   # first time only
npm run dev
# → MCP wrapper listening on http://localhost:4000
```

### Terminal 2 — Agent backend
```sh
cd agent
npm install   # first time only
npm run dev
# → Agent backend listening on http://localhost:4100
```

### Terminal 3 — Frontend
```sh
cd frontend
npm install   # first time only
npm run dev
# → Vite at http://localhost:5173
```

Open `http://localhost:5173/` in your browser.

---

## Try it

Click any of the three suggested prompts, or type your own:

| Prompt | Tool the agent picks |
|---|---|
| *"Find me bachelor's-degree colleges in California under $30k net price with at least an 80% graduation rate."* | `find_schools_by_criteria` |
| *"Compare UCLA and UC Berkeley side by side."* | `search_schools` × 2, then `compare_schools` |
| *"What is the median earnings 10 years after entry for University of Michigan-Ann Arbor graduates?"* | `search_schools`, then `get_school_profile` |
| *"USC"* | The agent will ask: "Did you mean USC Los Angeles or University of South Carolina?" |

The right-hand panel renders the structured tool output — single profile cards, ranked lists, or side-by-side tables. The collapsible "Tool timeline" at the bottom shows every call the agent made (name, args, duration, error if any).

---

## Verification

Run all tests and typechecks across the stack:

```sh
cd mcp-wrapper && npm run typecheck && npm test    # 10 tests
cd ../agent     && npm run typecheck && npm test   # 5 tests
cd ../frontend  && npm run typecheck               # type-only (no test runner yet)
```

Health check both services:

```sh
curl http://localhost:4000/health
curl http://localhost:4100/health
```

End-to-end smoke test from the command line (skipping the frontend):

```sh
curl -s -X POST http://localhost:4100/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tell me about UCLA in one sentence."}]}'
```

---

## Repository structure

```
InMarket Challenge/
├── README.md                  ← this file
├── implementation.md          ← per-phase build plan with EXTRAS backlog
├── chattranscript.html        ← full agentic-IDE conversation log
├── Challenge_Project_-_AI_Builder.pdf
├── Design Tips and Essential Web Skills.md
├── docker-compose.yml         ← (slated for EXTRA E12)
├── .gitignore
├── .env.example files (one per service)
│
├── mcp-wrapper/               ← MCP-style REST microservice
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           ← Express server + 4 routes
│       ├── schemas.ts         ← Zod schemas (input + output)
│       ├── scorecard-client.ts ← Upstream API client + key isolation
│       ├── transform.ts       ← Verbose JSON → flat normalized shapes
│       ├── http-helpers.ts    ← Zod error formatter, asyncHandler
│       ├── routes/
│       │   ├── search.ts          (POST /tools/search_schools)
│       │   ├── profile.ts         (POST /tools/get_school_profile)
│       │   ├── compare.ts         (POST /tools/compare_schools)
│       │   └── filter.ts          (POST /tools/find_schools_by_criteria)
│       └── transform.test.ts  ← 10 unit tests (vitest)
│
├── agent/                     ← LangChain.js agent service
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           ← Express + /chat endpoint
│       ├── agent.ts           ← Stateless agent runner (tool-call loop)
│       ├── tools.ts           ← 4 LangChain tools w/ Zod schemas
│       ├── prompts.ts         ← System prompt
│       ├── mcp-client.ts      ← Typed HTTP client to MCP wrapper
│       ├── types.ts           ← Response-shape mirrors
│       └── agent.test.ts      ← 5 prompt-content tests (vitest)
│
└── frontend/                  ← Vite + React + Tailwind UI
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css          ← Tailwind layers + design tokens
        ├── vite-env.d.ts
        ├── components/
        │   ├── Chat.tsx
        │   ├── ResultsPanel.tsx
        │   ├── SchoolCard.tsx
        │   ├── SchoolList.tsx
        │   └── ComparisonTable.tsx
        └── lib/
            ├── api.ts         ← postChat() against agent /chat
            ├── types.ts       ← Response-shape mirrors
            ├── format.ts      ← USD / percent / count formatters
            └── cn.ts          ← clsx + tailwind-merge helper
```

---

## Security model

| Secret | Lives in | Visible to |
|---|---|---|
| `SCORECARD_API_KEY` | `mcp-wrapper/.env` (gitignored) | MCP wrapper process only |
| `OPENROUTER_API_KEY` | `agent/.env` (gitignored) | Agent service process only |
| (Frontend) | — | The frontend has no secrets |

- The MCP wrapper sanitizes its own error messages (the upstream URL contains the key in a query param, but is never logged or echoed).
- The agent service additionally strips URLs and truncates upstream errors before they reach the model context or the frontend payload (defense in depth).
- The agent service's CORS is locked to a single origin (`AGENT_CORS_ORIGIN`, default `http://localhost:5173`).
- The agent service's error handler logs only `err.name` and status, never `err.message` (some SDK errors embed the request URL).
- Internal-token (`X-Internal-Token`) auth between the agent and the wrapper is slated as **EXTRA E1** in [`implementation.md`](./implementation.md).

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| MCP wrapper | Express + TypeScript + Zod | Smallest reasonable surface; Zod schemas double as input validation and runtime contract enforcement |
| Agent | Express + LangChain.js (`@langchain/openai`, `@langchain/core`) | Most mature Node tool-calling story |
| LLM | OpenRouter — `nvidia/nemotron-3-super-120b-a12b:free` | Free-tier reasoning model with reliable OpenAI-style tool calling; fallback to free Llama-3.3-70B if needed |
| Frontend | Vite + React 18 + TypeScript + TailwindCSS 3 | Fast, no SSR overhead; design system fits cleanly in Tailwind config |
| Type/build | TypeScript 5 across all three services | Single language story across the whole stack |

---

## What's next (slated EXTRAs, not yet built)

Listed in [`implementation.md`](./implementation.md) as `E1`–`E18`, ordered by impact-per-hour. Highlights:

- **E1**: Internal-token auth between agent and wrapper
- **E2**: Helmet + restricted CORS allowlist + body-size limits + secrets redaction in logs
- **E12**: Multi-stage Dockerfile per service + root `docker-compose.yml`
- **E16**: "Star of the show" hero treatment + visual-rhyming motif (frontend polish)
- **E17**: Accessibility Auditor agent pass (WCAG 2.1 AA target)

---

## License

This is a candidate project for the InMarket AI Builder hiring process.
