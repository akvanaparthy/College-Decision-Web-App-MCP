# Implementation Plan — College Decision Companion

This document is the granular, checklist-form build plan derived from the approved high-level plan. **CORE phases** fulfill the PDF-mandated deliverables. **EXTRAS** are rubric-helpful additions to be picked up only after CORE is shippable, ordered by impact-per-hour.

---

## Status (as of last commit)

**All 5 CORE phases complete.** Repo pushed to `origin/main` at `https://github.com/akvanaparthy/College-Decision-Web-App-MCP`. Demo recording is the only user-only step remaining. **Zero EXTRAS done** so far.

Conventions used below:
- `[x]` — completed
- `[ ]` — not done
- *(partial)* note — partially done; details follow

---

## Conventions

- Each task is checkbox-tracked here.
- Each phase has an explicit **Checkpoint** that must pass before moving on.
- A "**Code Reviewer pass**" means dispatching the Code Reviewer agent against the diff for that phase.
- Updates to this file happen at the close of every phase.

---

## Phase 0 — Foundations & required artifacts ✅

**Goal:** repo skeleton, both required Phase-0 artifacts, and verified upstream connectivity.

- [x] `.gitignore` at root (Node, env, build outputs, IDE)
- [x] Folders: `mcp-wrapper/`, `agent/`, `frontend/`
- [x] Three `.env.example` files (one per service) with documented variables
- [x] `implementation.md` (this file) committed
- [x] `chattranscript.html` created at root with prior turns backfilled and zoom-in toggles working
- [x] **Probe Nemotron-3 tool calling** on OpenRouter — verified working, no fallback needed
- [x] **Probe College Scorecard** with `curl` against `api.data.gov/ed/collegescorecard/v1/schools` — verified working

**Checkpoint:** ✅ both artifacts open cleanly; both keys produce successful HTTP 200 responses; Nemotron-3 honors tool calling.

---

## Phase 1 — MCP Server Wrapper (CORE) ✅

**Goal:** a minimum-viable microservice that the PDF describes, exposing 4 tools as REST routes.

### Scaffold
- [x] `mcp-wrapper/package.json` with deps: `express`, `zod`, `dotenv`, `cors`, native fetch, `typescript`, `@types/node`, `@types/express`, `tsx`, `vitest`
- [x] `tsconfig.json`
- [x] `src/index.ts` — Express server, mounts routes, listens on `MCP_WRAPPER_PORT`

### Schemas (`src/schemas.ts`)
- [x] `SchoolSummary` — id, name, city, state, ownership, size, admission_rate, `net_price_year`, `grad_rate`
- [x] `SchoolProfile` — extends SchoolSummary with tuition, earnings, debt, source
- [x] `ComparisonRow` — keyed comparison shape for 2-4 schools
- [x] `SchoolListResult` — `{ schools, total_matching, returned, applied_filters, source }` *(split `total` into `total_matching` + `returned` per Code Reviewer)*
- [x] Request schemas: `SearchSchoolsInput`, `GetSchoolProfileInput`, `CompareSchoolsInput`, `FindByCriteriaInput`

### Scorecard client (`src/scorecard-client.ts`)
- [x] `ScorecardClient.query(params)` — wraps the single Scorecard endpoint
- [x] Reads `SCORECARD_API_KEY` from env at module load; throws on missing/placeholder
- [x] Default 8s timeout on fetch via `AbortController`
- [x] Never logs the key; sanitized errors (URL contains key, never echoed)

### Transform (`src/transform.ts`)
- [x] `toSummary(rawSchool)` → `SchoolSummary` *(throws on missing id, per Code Reviewer)*
- [x] `toProfile(rawSchool)` → `SchoolProfile`
- [x] `toComparisonRows(schools)` → `ComparisonRow[]`
- [x] Snapshot-style unit tests with frozen Scorecard fixtures (10 tests, all pass)

### Routes (`src/routes/`)
- [x] `POST /tools/search_schools`
- [x] `POST /tools/get_school_profile`
- [x] `POST /tools/compare_schools` *(uses `Promise.allSettled` + per-id `failures[]`, per Code Reviewer)*
- [x] `POST /tools/find_schools_by_criteria` *(at-least-one-filter `.refine()` + `degree_type` filter)*
- [x] All routes: Zod-validate → client → transform → respond *(plus output validation via `*ResultSchema.parse()`)*
- [x] Structured error response: `{ error: { code, message, fields? } }` *(Zod errors `.flatten()`'d via `formatZodError`)*
- [x] All routes wrapped in `asyncHandler` so async rejections hit the Express error middleware

### Security (CORE)
- [x] `cors()` middleware with default allow-all (refined further in EXTRA E2)
- [x] `express.json({ limit: '64kb' })`
- [x] No key in any log line, response body, or thrown error message

### Tests
- [x] Transform unit tests (10 covering ownership, nulls, URL normalization, sentinel rejection, id-guard throw)
- [x] Smoke tests per route — *via live `curl` against running service rather than mocked fetch; same effect, fewer abstractions*

### Code Reviewer
- [x] Dispatched after Phase 1; 4 blockers + 7 strong suggestions returned. Blockers fixed in polish commit (`a482b14` → rebased to `199c634` then `23d29c0`).

**Checkpoint:** ✅ `curl` each tool with valid + invalid input — outputs match schemas, Zod rejections return 400 JSON.

---

## Phase 2 — LLM Agent Backend (CORE) ✅

**Goal:** an agent service that exposes a `/chat` endpoint, picks the right MCP tool, and returns structured results.

### Scaffold
- [x] `agent/package.json` with deps: `express`, `langchain`, `@langchain/core`, `@langchain/openai`, `zod`, `dotenv`, `cors`, native fetch, `typescript`, `tsx`, `vitest`
- [x] `tsconfig.json`
- [x] `src/index.ts` — Express server, listens on `AGENT_PORT`

### MCP client (`src/mcp-client.ts`)
- [x] Typed wrapper around the MCP wrapper's REST routes
- [x] Reads `MCP_BASE_URL` from env
- [x] One method per route, fully typed with shared shape mirrors *(plus `stripNulls()` helper for OpenAI strict-mode reconciliation)*

### LangChain Tools (`src/tools.ts`)
- [x] `searchSchoolsTool` — Zod-validated args, calls `mcp.searchSchools`
- [x] `getSchoolProfileTool`
- [x] `compareSchoolsTool` *(plus `.refine()` for unique school_ids)*
- [x] `findSchoolsByCriteriaTool`
- [x] Each tool's `description` is concise and route-disambiguating
- [x] All previously `.optional()` fields migrated to `.nullable()` for OpenAI strict-mode compatibility (warnings removed)

### Agent (`src/agent.ts`)
- [x] `ChatOpenAI` configured with `configuration.baseURL = "https://openrouter.ai/api/v1"` and `OPENROUTER_API_KEY`
- [x] Bind tools via `.bindTools([...])`
- [x] **Manual tool-execution loop** rather than LangGraph `createReactAgent` — chose this for transparency in the demo
- [x] Max 6 iterations to avoid runaway loops
- [x] Synthesizes a stable `tool_call_id` when provider omits it *(per Code Reviewer blocker)*
- [x] `sanitizeUpstreamMessage` strips URLs + truncates upstream errors before they reach model context or frontend
- [x] Empty-reply fallback so a no-content + no-tool-calls response never produces a blank bubble

### Prompt (`src/prompts.ts`)
- [x] System prompt: role, four-tool routing rules, USC disambiguation example, citation rule, no-hallucination rule, `degree_type:"bachelor"` default, tight formatting hints

### `/chat` endpoint
- [x] `POST /chat` — body `{ messages: ChatMessage[] }` → returns `{ reply, tool_calls[], iterations }`
- [x] Per-request: invoke agent, capture tool calls + outputs alongside final reply
- [x] CORS locked to single origin via `AGENT_CORS_ORIGIN` env *(per Code Reviewer suggestion)*

### Security (CORE)
- [x] `OPENROUTER_API_KEY` only from env; never to client; never in logs
- [x] No leaking of `MCP_BASE_URL` to client beyond a generic error
- [x] Error handler logs only `err.name` + status, never `err.message` (SDK errors may embed the api_key URL)
- [x] Body limit raised 64kb → 512kb to match request-schema upper bound

### Tests
- [x] Unit tests on system prompt content (5 tests covering tool names, degree_type default, citation, no-hallucination, USC disambiguation)
- [x] Integration test — *via live e2e through running MCP wrapper rather than mocked fetch; the 3 canonical queries verified all routings*

### Code Reviewer
- [x] Dispatched after Phase 2; 2 blockers + 5 strong suggestions returned. Both blockers + 5 strong suggestions fixed in polish commit (`55fb93b` → rebased to `0af2ab5`).

**Checkpoint:** ✅ All 3 canonical demo queries route to the correct tool with correct args.

---

## Phase 3 — Frontend Web App (CORE) ✅

**Goal:** a polished chat + results UI that renders structured tool outputs as components.

### Scaffold
- [x] Vite + React + TS project *(scaffolded manually rather than via `npm create vite` because the `frontend/` folder already held `.env.example` — create-vite refuses to write into a non-empty dir)*
- [x] Installed: `tailwindcss`, `postcss`, `autoprefixer`, `clsx`, `tailwind-merge`
- [ ] `class-variance-authority`, `lucide-react` — *not installed; not needed given hand-written components*
- [ ] `npx shadcn@latest init` — *skipped; chose hand-written components in shadcn aesthetic (lighter dep tree, fewer files for reviewer to audit)*
- [ ] shadcn components installed — *N/A per above; using Tailwind classes directly*

### Design system foundations (per `Design Tips and Essential Web Skills.md`)
- [x] Tailwind config: Major Third type scale (1.25×) starting at 16px body, `rem` units
- [x] Tailwind config: 8-pt spacing system *(Tailwind defaults already align)*
- [x] Anchor headline (Instrument Serif from Google Fonts) + Geist Sans + Geist Mono (from fontshare CDN)
- [x] Custom palette: parchment (60%), surface tint (30%), ink, forest accent, ochre CTA, opacity-derived variants
- [x] Opacity tokens for hierarchy (100 / 70 / 50 / 30 / 10) via custom `ink.*` colors

### Components (`src/components/`)
- [x] `Chat.tsx` — message list + input + suggested prompts empty-state + pending indicator w/ active-tool pill
- [x] `ResultsPanel.tsx` — discriminated-union render based on tool name + collapsible "Tool timeline"
- [x] `SchoolCard.tsx` — single profile card with hero stats + secondary stats grid + opacity hierarchy
- [x] `ComparisonTable.tsx` — side-by-side comparison with serif column headers + alternating row tints
- [x] `SchoolList.tsx` — numbered editorial-style ranking with stat trio per row
- [x] Loading and error states *(in Chat, ResultsPanel)*

### Plumbing
- [x] `src/lib/types.ts` — TypeScript types matching agent's wire shapes
- [x] `src/lib/api.ts` — `postChat(messages)` calling `VITE_AGENT_URL`, with typed `AgentApiError`
- [x] `src/lib/format.ts` — USD / percent / count formatters
- [x] `src/lib/cn.ts` — `clsx` + `tailwind-merge` helper
- [ ] `src/hooks/useChat.ts` — *not extracted as a hook; state lives directly in `App.tsx` since there's only one consumer (kept the surface smaller)*

### Skill / agent passes
- [x] Invoked `frontend-design` skill before laying out the page (committed to "Editorial Almanac" aesthetic)
- [ ] Code Reviewer pass on the frontend diff — *not yet run on this phase*

**Checkpoint:** ✅ `npm run dev` works; Vite serves all modules HTTP 200; end-to-end CORS query through `postChat()` succeeds. Visual rendering not yet verified by candidate in a browser.

---

## Phase 4 — Required documentation (CORE per PDF) ✅

- [x] Root `README.md` covering:
  - [x] Project description + the problem we're solving
  - [x] ASCII architecture diagram
  - [x] Prerequisites (Node 20+, npm 10+, modern browser)
  - [x] How to obtain `SCORECARD_API_KEY` (api.data.gov sign-up flow with URL)
  - [x] How to obtain `OPENROUTER_API_KEY` (with URL)
  - [x] How to set up each `.env` from `.env.example` (templates inline)
  - [x] How to install deps and run each service (three-terminal recipe)
  - [x] 3 canonical demo queries with predicted tool routing
  - [x] Verification recipes (typecheck, tests, health, e2e curl)
  - [x] Annotated repo tree
  - [x] Security model table
  - [x] Tech-stack rationale
- [x] All three `package.json` files list dependencies and scripts
- [x] Folder structure matches PDF: clear separation `frontend/`, `agent/`, `mcp-wrapper/`

**Checkpoint:** ✅ README is end-to-end self-contained for a fresh clone.

---

## Phase 5 — Demo video (CORE per PDF) — script ready, recording pending

### Script milestones (≤8 min total)
- [x] Script written (read-aloud format, stage directions bracketed) — author still has the file locally; deleted from repo per their preference
- [x] Trimmed for 6–8 min target time
- [x] Risky pre-baked rankings removed; "if something goes wrong" recovery notes added

Script covers all 7 required PDF content points:
- [x] On-camera intro — name, problem statement (~30s)
- [x] API choice + architecture walkthrough (~75s)
- [x] **Show 3 actual Claude Code prompts** used during build (~75s)
- [x] LLM agent setup walkthrough (~60s)
- [x] Live demo: 2 queries fully + 1 narrated (~2 min)
- [x] Security walkthrough — env files, key isolation, CORS (~40s)
- [x] **Verbal deployment discussion** — Docker / K8s / Serverless (~50s)
- [x] **Documentation philosophy** — README, implementation.md, chattranscript.html (~25s)
- [x] Wrap (~10s)

### Recording — user-only
- [ ] Pre-warm: run all 3 demo queries 5–10 min before recording
- [ ] Rehearse once (no record) — measure time
- [ ] Record final pass with on-camera + screen
- [ ] Review playback — re-record if any required PDF content point is missing

**Checkpoint:** video covers all 7 PDF-named content points and is ≤8 min.

---

## EXTRAS — picked up only after CORE is shippable

Ordered by recommended pickup order. Each is independent. **None done so far** — a handful are partially in place as a byproduct of fixing Code Reviewer findings:

### Security cluster (highest rubric leverage)
- [ ] **E1** — Internal-token (`X-Internal-Token`) auth between agent and wrapper
- [ ] **E2** — Helmet on both services + restricted CORS allowlist + body size limits + secrets-redaction in logs
  - *(partial)*: agent CORS already locked to single origin via `AGENT_CORS_ORIGIN`; agent body limit raised to 512kb; agent error-handler omits `err.message`. Wrapper still default-permissive CORS and no Helmet.
- [ ] **E3** — `SECURITY.md` documenting threat model and key flow

### Deployment + docs cluster
- [ ] **E12** — Multi-stage Dockerfile per service + root `docker-compose.yml`
- [ ] **E15** — Per-service `README.md`
- [ ] **E14** — 3 ADRs (API choice, MCP-as-REST, free-tier LLM)
- [ ] **E13** — OpenAPI auto-docs from MCP wrapper

### Frontend polish cluster
- [ ] **E16** — "Star of the show" hero treatment + visual-rhyming motif + subtle depth
  - *(partial)*: subtle paper-grain texture via CSS-only radial-gradient on `body::before` is already in `index.css`. Hero treatment and motif not yet done.
- [ ] **E18** — Recharts visualizations for criteria-filter results
- [ ] **E17** — Accessibility Auditor agent pass (WCAG 2.1 AA target)

### Resilience cluster
- [ ] **E4** — Pino structured logging + request-ID propagation
- [ ] **E5** — Timeouts + retry-with-backoff on Scorecard client
  - *(partial)*: 8s `AbortController` timeout is in `scorecard-client.ts`. Retry-with-backoff not done.
- [ ] **E6** — `/health` and `/ready` endpoints on both services
  - *(partial)*: `/health` exists on both. `/ready` (upstream-reachability probe) not done.

### Performance + observability cluster
- [ ] **E7** — SSE streaming on `/chat` + frontend streaming UI
- [ ] **E8** — LRU in-memory cache on MCP wrapper
- [ ] **E9** — Circuit breaker (opossum) on Scorecard client
- [ ] **E10** — `express-rate-limit` on both services
- [ ] **E11** — Prometheus `/metrics` endpoint

---

## Final review (after CORE + chosen extras)

- [x] Code Reviewer agent — ran after Phase 1 and Phase 2; blockers fixed before moving on. Phase 3 (frontend) review not yet run.
- [ ] If E2 done: Security Engineer agent — full audit
- [ ] If E17 done: Accessibility Auditor agent — full audit
- [x] Run all 3 canonical demo queries one last time end-to-end *(verified live before final push)*
- [x] Final commits, push to GitHub *(history rewritten to strip Co-Author trailers, force-pushed clean)*
- [ ] Record demo *(user-only; script is ready)*
