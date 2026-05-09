# Implementation Plan — College Decision Companion

This document is the granular, checklist-form build plan derived from the approved high-level plan. **CORE phases** fulfill the PDF-mandated deliverables. **EXTRAS** are rubric-helpful additions to be picked up only after CORE is shippable, ordered by impact-per-hour.

---

## Conventions

- Each task is checkbox-tracked here.
- Each phase has an explicit **Checkpoint** that must pass before moving on.
- A "**Code Reviewer pass**" means dispatching the Code Reviewer agent against the diff for that phase.
- Updates to this file happen at the close of every phase.

---

## Phase 0 — Foundations & required artifacts

**Goal:** repo skeleton, both required Phase-0 artifacts, and verified upstream connectivity.

- [ ] `.gitignore` at root (Node, env, build outputs, IDE)
- [ ] Folders: `mcp-wrapper/`, `agent/`, `frontend/`
- [ ] Three `.env.example` files (one per service) with documented variables
- [ ] `implementation.md` (this file) committed
- [ ] `chattranscript.html` created at root with all 14 prior turns backfilled and zoom-in toggles working
- [ ] **Probe Nemotron-3 tool calling** on OpenRouter via a one-shot script — if the model does not honor OpenAI-style `tools`, fall back to `meta-llama/llama-3.3-70b-instruct:free` and document the swap
- [ ] **Probe College Scorecard** with one `curl` against `api.data.gov/ed/collegescorecard/v1/schools` — confirm key works and response shape matches our planned transform

**Checkpoint:** both artifacts open cleanly in a browser; both keys produce successful HTTP 200 responses; chosen LLM honors tool calling.

---

## Phase 1 — MCP Server Wrapper (CORE)

**Goal:** a minimum-viable microservice that the PDF describes, exposing 4 tools as REST routes.

### Scaffold
- [ ] `mcp-wrapper/package.json` with deps: `express`, `zod`, `dotenv`, `cors`, `node-fetch` (or native), `typescript`, `@types/node`, `@types/express`, `tsx`, `vitest`
- [ ] `tsconfig.json`
- [ ] `src/index.ts` — Express server, mounts routes, listens on `MCP_WRAPPER_PORT`

### Schemas (`src/schemas.ts`)
- [ ] `SchoolSummary` — id, name, city, state, ownership, size, admission_rate, net_price, grad_rate
- [ ] `SchoolProfile` — extends SchoolSummary with cost breakdown, demographics, completion outcomes, median earnings
- [ ] `ComparisonRow` — keyed comparison shape for 2-4 schools
- [ ] `SchoolListResult` — `{ schools: SchoolSummary[], total: number, applied_filters: object }`
- [ ] Request schemas: `SearchSchoolsInput`, `GetProfileInput`, `CompareSchoolsInput`, `FindByCriteriaInput`

### Scorecard client (`src/scorecard-client.ts`)
- [ ] `getSchools(params)` — wraps the single Scorecard endpoint
- [ ] Reads `SCORECARD_API_KEY` from env at module load; throws on missing
- [ ] Default 8s timeout on fetch
- [ ] Never logs the key; never returns it in errors

### Transform (`src/transform.ts`)
- [ ] `toSummary(rawSchool)` → `SchoolSummary`
- [ ] `toProfile(rawSchool)` → `SchoolProfile`
- [ ] `toComparisonRows(schools)` → `ComparisonRow[]`
- [ ] Snapshot-style unit tests with frozen Scorecard fixtures

### Routes (`src/routes/`)
- [ ] `POST /tools/search_schools`
- [ ] `POST /tools/get_school_profile`
- [ ] `POST /tools/compare_schools`
- [ ] `POST /tools/find_schools_by_criteria`
- [ ] All routes: Zod-validate input → call Scorecard client → transform → respond
- [ ] Structured error response: `{ error: { code, message } }`

### Security (CORE)
- [ ] `cors()` middleware with default allow-all (refine to allowlist in EXTRA E2)
- [ ] `express.json({ limit: '64kb' })`
- [ ] No key in any log line, response body, or thrown error message

### Tests
- [ ] Transform unit tests
- [ ] One smoke test per route with mocked fetch

### Code Reviewer
- [ ] Dispatch Code Reviewer agent on the diff before moving to Phase 2

**Checkpoint:** start service; `curl` each tool with valid + invalid input; verify outputs match `SchoolSummary` / `SchoolProfile` / `ComparisonRow[]` / `SchoolListResult` and Zod rejections return 400 JSON.

---

## Phase 2 — LLM Agent Backend (CORE)

**Goal:** an agent service that exposes a `/chat` endpoint, picks the right MCP tool, and returns structured results.

### Scaffold
- [ ] `agent/package.json` with deps: `express`, `langchain`, `@langchain/core`, `@langchain/openai`, `zod`, `dotenv`, `cors`, `node-fetch`, `typescript`, `tsx`, `vitest`
- [ ] `tsconfig.json`
- [ ] `src/index.ts` — Express server, listens on `AGENT_PORT`

### MCP client (`src/mcp-client.ts`)
- [ ] Typed wrapper around the MCP wrapper's REST routes
- [ ] Reads `MCP_BASE_URL` from env
- [ ] One method per route, fully typed with the shared schema types

### LangChain Tools (`src/tools.ts`)
- [ ] `searchSchoolsTool` — Zod-validated args, calls `mcp.searchSchools`
- [ ] `getSchoolProfileTool` — analogous
- [ ] `compareSchoolsTool` — analogous
- [ ] `findSchoolsByCriteriaTool` — analogous
- [ ] Each tool's `description` is concise but route-disambiguating (the model must be able to pick the right one from the description alone)

### Agent (`src/agent.ts`)
- [ ] `ChatOpenAI` configured with `configuration.baseURL = "https://openrouter.ai/api/v1"` and `OPENROUTER_API_KEY`
- [ ] Bind tools via `.bindTools([...])`
- [ ] LangGraph `createReactAgent` (or equivalent ToolExecutor loop) so multi-tool answers work
- [ ] Limit to ~6 tool-calling iterations to avoid runaway loops

### Prompt (`src/prompts.ts`)
- [ ] System prompt: role ("College Decision Companion"), tool-routing rules, disambiguation policy ("if user says 'USC' ask USC-LA vs USC-SC"), citation rule ("source: U.S. Dept. of Education College Scorecard"), no-hallucination rule, formatting rule ("return one of: {summary, profile, comparison, list}")

### `/chat` endpoint
- [ ] `POST /chat` — body `{ messages: ChatMessage[] }` → returns `{ reply: string, tool_results: ToolResult[] }`
- [ ] Per-request: invoke agent, capture tool calls + outputs alongside final reply
- [ ] Basic CORS for frontend origin

### Security (CORE)
- [ ] `OPENROUTER_API_KEY` only from env; never to client; never in logs
- [ ] No leaking of `MCP_BASE_URL` to client beyond a generic error

### Tests
- [ ] Unit test the system prompt rendering
- [ ] One integration test: mocked MCP wrapper responses → assert agent fires correct tool for canonical query

### Code Reviewer
- [ ] Dispatch Code Reviewer agent on the diff before moving to Phase 3

**Checkpoint:** for each of the 3 canonical demo queries, agent fires the correct tool (visible in logs) and returns a structured `tool_results` array.

---

## Phase 3 — Frontend Web App (CORE)

**Goal:** a polished chat + results UI that renders structured tool outputs as components.

### Scaffold
- [ ] `npm create vite@latest frontend -- --template react-ts`
- [ ] Install: `tailwindcss`, `postcss`, `autoprefixer`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- [ ] `npx shadcn@latest init` → choose stone/neutral palette
- [ ] Components installed: `button`, `card`, `input`, `scroll-area`, `badge`, `separator`, `skeleton`

### Design system foundations (per `Design Tips and Essential Web Skills.md`)
- [ ] Tailwind config: type scale (Major Third, base 16px in `rem`)
- [ ] Tailwind config: 8-pt spacing system aligned to default Tailwind
- [ ] Anchor headline font + supporting sans (Instrument Serif + Geist Sans, or alternatives from fontshare.com)
- [ ] CSS variables: 60-30-10 palette with defined roles (`--bg`, `--surface`, `--accent`)
- [ ] Opacity tokens for hierarchy (100 / 70 / 50)

### Components (`src/components/`)
- [ ] `Chat.tsx` — message list + input, calls agent `/chat`
- [ ] `ResultsPanel.tsx` — discriminated-union render based on tool name
- [ ] `SchoolCard.tsx` — single profile card (logo, name, city/state, key stats, opacity hierarchy)
- [ ] `ComparisonTable.tsx` — side-by-side comparison
- [ ] `SchoolList.tsx` — sortable list with key stats per row
- [ ] Loading and error states for each

### Plumbing
- [ ] `src/lib/types.ts` — TypeScript types matching backend schemas
- [ ] `src/lib/api.ts` — `postChat(messages)` calling `VITE_AGENT_URL`
- [ ] `src/hooks/useChat.ts` — minimal hook managing messages + pending tool calls

### Skill / agent passes
- [ ] Invoke `frontend-design` skill before laying out the page
- [ ] Code Reviewer pass on the diff

**Checkpoint:** `npm run dev` → open browser → run all 3 canonical queries → correct components render with correct data.

---

## Phase 4 — Required documentation (CORE per PDF)

- [ ] Root `README.md`:
  - Project description + the problem we're solving
  - Architecture diagram
  - Prerequisites (Node version)
  - How to obtain `SCORECARD_API_KEY` (api.data.gov sign-up flow)
  - How to obtain `OPENROUTER_API_KEY`
  - How to set up each `.env` from `.env.example`
  - How to install deps and run each service
  - 3 canonical demo queries to try
- [ ] All three `package.json` files list dependencies and scripts
- [ ] Folder structure verified to match PDF: clear separation `frontend/`, `agent/`, `mcp-wrapper/`

**Checkpoint:** a teammate could clone the repo and run the entire stack from the README in <15 minutes.

---

## Phase 5 — Demo video (CORE per PDF)

### Script milestones (≤8 min total)
- [ ] On-camera intro — name, problem statement (~30s)
- [ ] Architecture walkthrough on screen (~60s)
- [ ] **Show 3-4 actual Claude Code prompts** used during build (~90s)
- [ ] Live demo: 3 queries, 3 different tools (~2-3 min)
- [ ] Security walkthrough — env files, key isolation (~45s)
- [ ] **Verbal deployment discussion** — Docker now, K8s/Cloud Run/Lambda for prod (~60s)
- [ ] **Documentation philosophy** — README, ADRs, OpenAPI auto-docs (~30s)

### Recording
- [ ] Rehearse once (no record) — measure time
- [ ] Record final pass with on-camera + screen
- [ ] Review playback — re-record if any required PDF content point is missing

**Checkpoint:** video covers all 7 PDF-named content points and is ≤8 min.

---

## EXTRAS — picked up only after CORE is shippable

Ordered by recommended pickup order. Each is independent.

### Security cluster (highest rubric leverage)
- [ ] **E1** — Internal-token (`X-Internal-Token`) auth between agent and wrapper
- [ ] **E2** — Helmet on both services + restricted CORS allowlist + body size limits + secrets-redaction in logs
- [ ] **E3** — `SECURITY.md` documenting threat model and key flow

### Deployment + docs cluster
- [ ] **E12** — Multi-stage Dockerfile per service + root `docker-compose.yml`
- [ ] **E15** — Per-service `README.md`
- [ ] **E14** — 3 ADRs (API choice, MCP-as-REST, free-tier LLM)
- [ ] **E13** — OpenAPI auto-docs from MCP wrapper

### Frontend polish cluster
- [ ] **E16** — "Star of the show" hero treatment + visual-rhyming motif + subtle depth
- [ ] **E18** — Recharts visualizations for criteria-filter results
- [ ] **E17** — Accessibility Auditor agent pass (WCAG 2.1 AA target)

### Resilience cluster
- [ ] **E4** — Pino structured logging + request-ID propagation
- [ ] **E5** — Timeouts + retry-with-backoff on Scorecard client
- [ ] **E6** — `/health` and `/ready` endpoints on both services

### Performance + observability cluster
- [ ] **E7** — SSE streaming on `/chat` + frontend streaming UI
- [ ] **E8** — LRU in-memory cache on MCP wrapper
- [ ] **E9** — Circuit breaker (opossum) on Scorecard client
- [ ] **E10** — `express-rate-limit` on both services
- [ ] **E11** — Prometheus `/metrics` endpoint

---

## Final review (after CORE + chosen extras)

- [ ] Code Reviewer agent — final pass on each service
- [ ] If E2 done: Security Engineer agent — full audit
- [ ] If E17 done: Accessibility Auditor agent — full audit
- [ ] Run all 3 canonical demo queries one last time end-to-end
- [ ] Final commits, push to GitHub, record demo
