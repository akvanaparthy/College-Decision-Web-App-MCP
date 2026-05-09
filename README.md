# College Decision Companion

> **InMarket Challenge — AI Builder Candidate Project**
> An agentic web app that helps students cut through the noise of college selection.
> Built end-to-end in Claude Code as a "true agentic IDE" demonstration.

## What it does

A conversational assistant that answers real college-choice questions like:

- "Find me CS programs in California under $30k net price with >80% grad rate"
- "Compare UCLA and UC Berkeley for computer science"
- "What's the median earnings 10 years out for UMich CS?"

An LLM agent (LangChain.js + OpenRouter Nemotron-3) decides which of four tools to call against a College Scorecard MCP-style microservice wrapper, then renders structured results as rich UI components — not raw JSON.

## Architecture

```
┌──────────────┐   HTTP   ┌────────────────────┐   HTTP   ┌──────────────────────┐  HTTPS  ┌──────────────────┐
│  Frontend    │  ──────▶ │ Agent Backend      │  ──────▶ │  MCP Wrapper         │ ──────▶ │  College         │
│  Vite/React  │          │ Express +          │          │  Express +           │         │  Scorecard       │
│              │          │ LangChain.js +     │          │  Zod + transform    │          │  (api.data.gov)  │
│              │          │ Nemotron-3         │          │                      │         │                  │
└──────────────┘          └────────────────────┘          └──────────────────────┘         └──────────────────┘
   no secrets               OPENROUTER_API_KEY              SCORECARD_API_KEY                      —
```

Three services, three folders, three `package.json` files. Two API keys, each isolated to its service. Frontend has zero secrets.

## Status

This README is a placeholder during the build. Full setup, env-key acquisition, and run instructions land in Phase 4. See [`implementation.md`](./implementation.md) for the live build plan and [`chattranscript.html`](./chattranscript.html) for the agentic-IDE conversation log that produced this project.
