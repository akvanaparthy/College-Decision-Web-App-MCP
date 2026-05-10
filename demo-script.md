# Demo Video Script

**Target length:** 6–8 minutes (PDF says video is for "preliminary review" — keep it tight)
**Tool:** ScreenRec (or Loom / OBS / QuickTime)
**Required:** candidate on camera + screen capture
**PDF content points the video MUST cover (do not skip any):**

1. The selected API and its core function
2. The architecture of the MCP Server and its benefits
3. The LLM Agent setup (tool definitions, prompt structure, LangChain logic)
4. The end-to-end user experience in the web app
5. Verbal deployment discussion (Docker, Kubernetes, Serverless)
6. Documentation philosophy (for a new developer taking over)
7. The actual prompts used in the agentic IDE during the build (rubric: 30% Agentic Development)

---

## Pre-recording checklist

- [ ] All three services running locally:
      `mcp-wrapper` on `:4000`, `agent` on `:4100`, `frontend` on `:5173`
- [ ] Browser at `http://localhost:5173/` reloaded fresh (no leftover messages)
- [ ] Webcam on, mic level checked
- [ ] VS Code / Claude Code window open with at least one prompt-history view ready to show
- [ ] Architecture diagram open in a second tab (use the README's ASCII diagram, or a quick draw.io)
- [ ] Terminal split-pane with all three services visible (or a `tail -f` of one log)
- [ ] One mental rehearsal pass — time it

---

## Section 1 — Intro (≤30s)

**On camera, no slides:**

> "Hi, I'm Akshay Vanaparthy. For the InMarket AI Builder challenge I built **College Decision Companion** — a conversational research assistant for prospective U.S. college students. The core problem: r/ApplyingToCollege is full of people drowning in spreadsheets of 12 schools and the official College Scorecard site is data-rich but UX-hostile. I wrap their public API in an LLM agent that picks the right tool per question and returns results as cards and comparison tables — not raw JSON."

---

## Section 2 — API choice + MCP architecture (≈90s)

**Switch to architecture diagram on screen:**

> "I picked the **U.S. Department of Education College Scorecard** API for three reasons: it solves a real recurring pain point that's articulated everywhere from r/ApplyingToCollege to r/personalfinance; it's free with an api.data.gov key — so the security rubric for key handling has actual content to demonstrate; and it naturally decomposes into four distinct tools, which is exactly what makes 'contextual tool calling' interesting."

**Walk through the diagram, left to right:**

> "Three services. **MCP wrapper** at the right — Express + Zod, four routes: search_schools, get_school_profile, compare_schools, find_schools_by_criteria. The Scorecard API key lives **only** in this service's `.env`; it never touches the agent service or the frontend. The wrapper also normalizes Scorecard's verbose JSON into flat shapes designed for direct UI rendering — so a LLM never sees raw upstream data and the frontend never has to massage anything.
>
> **Agent backend** in the middle — Express + LangChain.js. Holds the OpenRouter API key in its `.env`, never exposes it. The agent is stateless: the frontend sends the full conversation, the agent runs a tool-call loop up to 6 iterations, returns reply + a record of every tool call.
>
> **Frontend** on the left — Vite + React + Tailwind, no secrets at all. The agent's CORS is locked to the frontend's origin.
>
> The benefit of this three-layer split is **separation of concerns**: each service has one job, one secret, one clear contract. If we wanted to swap Scorecard for a different data source tomorrow, only the wrapper changes. If we want to swap the LLM, only the agent changes."

---

## Section 3 — Agentic IDE prompts (≈90s)

**Switch to Claude Code with the chat history visible.**

> "I built this entire stack in Claude Code, which is a true agentic IDE — it dispatches subagents, runs multi-step plans, executes shell commands autonomously. The PDF named Cursor and GitHub Copilot Chat as examples, but Claude Code fits the same category and is arguably the most agentic of the three."

**Show 3–4 actual prompts. Suggested ones to highlight:**

1. *The first one* — the planning kickoff: "this is our challenge, read it properly without missing anything and let me know what you exactly understood." Show how Claude returned a structured PDF read.
2. *The Reddit research dispatch* — show the Trend Researcher subagent prompt that mined Reddit for real pain points.
3. *The Code Reviewer dispatch on the MCP wrapper* — show the structured review with 4 BLOCKERS and how each was addressed in the polish commit.
4. *Optional 4th* — the frontend-design skill invocation showing the Editorial Almanac aesthetic decision.

> "Each of these prompts represents a multi-step autonomous workflow — not 'autocomplete this function.' That's the agentic-IDE rubric in practice."

---

## Section 4 — LLM agent setup walkthrough (≈90s)

**Open `agent/src/prompts.ts`, then `agent/src/tools.ts`.**

> "The agent has four LangChain tools. Each tool wraps one MCP wrapper route. The tool's **description** is what the model uses to decide when to call it — they're written to be disambiguating, not just descriptive. The Zod **schema** doubles as JSON Schema for the model and runtime validation before the args reach the wrapper."

**Switch to `prompts.ts`:**

> "The system prompt has explicit routing rules — 'specific name → search', 'compare 2-4 schools → search to resolve ids, then compare', and so on. There's a critical default: 'always pass degree_type:bachelor for general college queries'. Without that, the wrapper returns trade schools and barber colleges instead of universities — discovered during testing."

**Open `agent/src/agent.ts`:**

> "The agent runner is a manual tool-call loop, not a prebuilt React agent. Reason: transparency. Up to 6 iterations of model invoke → execute requested tools → push tool results back into the message array → invoke again. Each tool call is recorded with name, args, result, error if any, and duration — the frontend renders this as a 'tool timeline' for the user to inspect."

---

## Section 5 — Live demo (≈3 min)

**Switch to browser at `http://localhost:5173/`.**

Run all three canonical queries. Pause briefly between each to let the UI render.

### Query 1 — `find_schools_by_criteria`
**Type:** *"Find me bachelor's-degree colleges in California under $30k net price with at least an 80% graduation rate."*

> "Watch the loading indicator — it shows the active tool name. The agent picks `find_schools_by_criteria`, passes the right args including degree_type:bachelor, and the panel renders an editorial-style numbered list. Top result is CalTech, then Claremont McKenna, Pomona, UCB, UCLA — exactly what a prospective student would want to see."

**Expand the "Tool timeline" at the bottom:**

> "And here's every tool call the agent made — name, arguments, duration. Full transparency."

### Query 2 — `compare_schools`
**Type:** *"Now compare UCLA and UC Berkeley side by side."*

> "Watch this one carefully — the agent doesn't have UCLA or Berkeley's ids yet, so it does **two `search_schools` calls** to resolve them, then calls `compare_schools` with the resolved ids. Three tool calls in sequence. The output renders as a side-by-side table."

### Query 3 — `get_school_profile`
**Type:** *"What is the median earnings 10 years after entry for University of Michigan-Ann Arbor graduates?"*

> "The agent searches, gets the id, then fetches the full profile. The reply is one focused sentence with the exact figure cited from Scorecard. The right panel renders the full school card."

---

## Section 6 — Security walkthrough (≈45s)

**Open three terminals or split the screen showing all three `.env.example` files (NOT `.env` — never on camera).**

> "Three `.env` files, three `.env.example` files committed with placeholders, real `.env` files in `.gitignore`. The Scorecard key only exists in `mcp-wrapper/.env`. The OpenRouter key only exists in `agent/.env`. The frontend has no secrets at all.
>
> Defense in depth: the agent's error handler logs only `err.name` and HTTP status, never `err.message` — because some SDK errors embed the request URL, which contains the api_key. The agent also strips URLs from any upstream error message before it can flow into model context or the frontend payload."

**Open `agent/src/index.ts` and point to the CORS line:**

> "Agent's CORS is locked to a single origin via `AGENT_CORS_ORIGIN` env. Default is the local frontend; for staging or production you'd swap in the deployed origin."

---

## Section 7 — Deployment discussion (≈60s)

**Verbal only — no need for slides.**

> "For deployment, three options I'd consider depending on traffic and ops appetite:
>
> **Docker Compose** for local dev or single-VM deployments — multi-stage Dockerfiles per service, each with a non-root user. The `docker-compose.yml` brings up all three with a shared internal network. This is what's listed as Extra E12 in `implementation.md`.
>
> **Kubernetes** for serious scale — three Deployments, three Services, an Ingress. The wrapper and agent both stateless so HPA scales them independently. Secrets via SealedSecrets or external Secret Manager — never as plain ConfigMaps. Health and readiness probes I've already designed for in the code structure (Extra E6).
>
> **Serverless / Cloud Run / Lambda** — given everything is stateless and Node, this is the cheapest option. Wrapper as one Cloud Run service, agent as another, frontend as static hosting on Cloudflare Pages or S3+CloudFront. Free tier likely covers the entire demo lifecycle.
>
> For this candidate project I focused on getting the architecture right first — deployment is a verbal discussion per the brief, but everything in the code is deployment-ready: stateless services, env-only config, sanitized errors, no in-memory session state."

---

## Section 8 — Documentation philosophy (≈30s)

> "Three audiences: a new developer taking over, a reviewer like yourselves, and future-me six months out.
>
> The `README.md` covers everything a new dev needs to clone-and-run in under 15 minutes: prerequisites, how to get both API keys (with the actual signup URLs), three `.env` templates, three-terminal run instructions, verification recipes.
>
> `implementation.md` is the per-phase build plan with the EXTRAS backlog ranked by impact-per-hour — anyone picking this up knows exactly what's CORE versus polish.
>
> `chattranscript.html` is the full agentic-IDE conversation log — every prompt I gave Claude Code, the response summary, what was decided. A new developer can read it like a project diary instead of reverse-engineering decisions from commits.
>
> Per-service docs are deliberately thin — the code is self-documenting by virtue of TypeScript types, Zod schemas as runtime contracts, and tight, named functions. I'd rather have one excellent README than ten that drift."

---

## Section 9 — Wrap (≤15s)

> "That's the build. Three services, four tools, real data, real architecture, demonstrated end-to-end. Repo link is in the description. Thanks for watching."

---

## Common pitfalls during recording

- **OpenRouter rate limit mid-demo** — the free tier has a daily cap. Test the day-of, and have one fallback model already configured (`OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.3-70b-instruct:free`).
- **Long iterations** — one of the canonical queries takes 4 iterations and ~15s. Cut to a different talking point during waits, or pre-warm with a dummy query before recording.
- **Saying "MCP" too often** — clarify once that this is "MCP-style microservice" (not the Anthropic protocol), then move on. The PDF's wording predates the protocol.
- **Reading from the script** — internalize the bullet points, then talk naturally. Authentic > perfect.
- **Forgetting on-camera** — the rubric explicitly says "Candidate must appear on camera." Picture-in-picture webcam in the corner is enough.
