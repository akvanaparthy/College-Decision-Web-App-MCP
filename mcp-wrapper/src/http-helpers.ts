import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodError } from 'zod';

/**
 * Format a Zod validation error into a clean `{ field: [messages] }` shape
 * that an LLM tool consumer can read at a glance — far more useful than the
 * raw issue array Zod stringifies by default.
 */
export function formatZodError(err: ZodError): {
  fields: Record<string, string[]>;
  message: string;
} {
  const fields: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.length === 0 ? '_root' : issue.path.join('.');
    if (!fields[path]) fields[path] = [];
    fields[path].push(issue.message);
  }
  const summary = Object.entries(fields)
    .map(([k, msgs]) => `${k}: ${msgs.join('; ')}`)
    .join(' | ');
  return { fields, message: summary };
}

export function badRequest(res: Response, err: ZodError): void {
  const { fields, message } = formatZodError(err);
  res.status(400).json({
    error: { code: 'invalid_input', message, fields },
  });
}

export function upstreamError(res: Response, err: unknown): void {
  res.status(502).json({
    error: {
      code: 'upstream_error',
      message: err instanceof Error ? err.message : 'Unknown upstream error',
    },
  });
}

/**
 * Wrap an async handler so that any rejected promise lands in Express's
 * error middleware instead of becoming an unhandledRejection.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
