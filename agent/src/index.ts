import 'dotenv/config';
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';

import { McpClient } from './mcp-client.js';
import { buildTools } from './tools.js';
import { createAgentRunner } from './agent.js';
import type { ChatMessage } from './types.js';

// ─── Config & startup checks ─────────────────────────────────────────────────

const PORT = Number(process.env['AGENT_PORT'] ?? 4100);
const OPENROUTER_API_KEY = process.env['OPENROUTER_API_KEY'];
const OPENROUTER_BASE_URL =
  process.env['OPENROUTER_BASE_URL'] ?? 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL =
  process.env['OPENROUTER_MODEL'] ?? 'nvidia/nemotron-3-super-120b-a12b:free';
const MCP_BASE_URL = process.env['MCP_BASE_URL'] ?? 'http://localhost:4000';

if (!OPENROUTER_API_KEY) {
  console.error(
    'FATAL: OPENROUTER_API_KEY is not set. Copy agent/.env.example to .env and fill it in.'
  );
  process.exit(1);
}

// ─── Wire dependencies ───────────────────────────────────────────────────────

const llm = new ChatOpenAI({
  model: OPENROUTER_MODEL,
  apiKey: OPENROUTER_API_KEY,
  configuration: {
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      // OpenRouter requires these for free-tier identification
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'College Decision Companion',
    },
  },
  temperature: 0,
  maxRetries: 1,
});

const mcp = new McpClient({ baseUrl: MCP_BASE_URL });
const tools = buildTools(mcp);
const runAgent = createAgentRunner({ llm, tools, maxIterations: 6 });

// ─── Request schema ─────────────────────────────────────────────────────────

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(40),
});

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'agent',
    model: OPENROUTER_MODEL,
    mcp_base_url: MCP_BASE_URL,
  });
});

app.post(
  '/chat',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'invalid_input', message: parsed.error.message },
      });
      return;
    }
    try {
      const result = await runAgent(parsed.data.messages as ChatMessage[]);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Unknown route' } });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error:', err instanceof Error ? err.message : err);
  res
    .status(500)
    .json({ error: { code: 'internal_error', message: 'Something went wrong' } });
};
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Agent backend listening on http://localhost:${PORT}`);
  console.log(`  model:        ${OPENROUTER_MODEL}`);
  console.log(`  mcp_base_url: ${MCP_BASE_URL}`);
});

const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
