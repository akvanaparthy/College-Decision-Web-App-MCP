import 'dotenv/config';
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from 'express';
import cors from 'cors';

import { ScorecardClient } from './scorecard-client.js';
import { searchSchoolsHandler } from './routes/search.js';
import { getSchoolProfileHandler } from './routes/profile.js';
import { compareSchoolsHandler } from './routes/compare.js';
import { findByCriteriaHandler } from './routes/filter.js';

// ─── Config & startup checks ─────────────────────────────────────────────────

const PORT = Number(process.env['MCP_WRAPPER_PORT'] ?? 4000);
const API_KEY = process.env['SCORECARD_API_KEY'];

if (!API_KEY) {
  console.error(
    'FATAL: SCORECARD_API_KEY is not set. Copy mcp-wrapper/.env.example to .env and fill it in.'
  );
  process.exit(1);
}

const client = new ScorecardClient(API_KEY);

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors()); // Phase-1 default: allow all origins. Restricted in EXTRA E2.
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'mcp-wrapper' });
});

app.post('/tools/search_schools', searchSchoolsHandler(client));
app.post('/tools/get_school_profile', getSchoolProfileHandler(client));
app.post('/tools/compare_schools', compareSchoolsHandler(client));
app.post('/tools/find_schools_by_criteria', findByCriteriaHandler(client));

// 404 for unknown routes
app.use((_req: Request, res: Response) => {
  res
    .status(404)
    .json({ error: { code: 'not_found', message: 'Unknown route' } });
});

// Final error handler — never echo back the api key or upstream URL.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error:', err instanceof Error ? err.message : err);
  res
    .status(500)
    .json({ error: { code: 'internal_error', message: 'Something went wrong' } });
};
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`MCP wrapper listening on http://localhost:${PORT}`);
});

// Graceful shutdown so dev restarts (tsx watch) close the socket cleanly.
const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
