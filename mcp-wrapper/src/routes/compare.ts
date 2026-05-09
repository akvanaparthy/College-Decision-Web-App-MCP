import type { Request, Response } from 'express';
import { ScorecardClient } from '../scorecard-client.js';
import {
  CompareSchoolsInputSchema,
  SOURCE_LITERAL,
  type ComparisonResult,
} from '../schemas.js';
import { toProfile, toComparisonRows } from '../transform.js';

export function compareSchoolsHandler(client: ScorecardClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const parsed = CompareSchoolsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'invalid_input', message: parsed.error.message },
      });
      return;
    }
    const { school_ids } = parsed.data;

    try {
      // Fetch each school's profile in parallel. The Scorecard API supports
      // single-id queries reliably; comma-separated IDs work but parallel
      // single-id calls give clean per-school error attribution.
      const profiles = await Promise.all(
        school_ids.map(async (id) => {
          const raw = await client.query({
            id,
            fields: ScorecardClient.PROFILE_FIELDS,
          });
          const first = raw.results[0];
          if (!first) {
            throw new Error(`No school with id ${id}`);
          }
          return toProfile(first);
        })
      );

      const result: ComparisonResult = {
        schools: profiles,
        rows: toComparisonRows(profiles),
        source: SOURCE_LITERAL,
      };
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: {
          code: 'upstream_error',
          message: err instanceof Error ? err.message : 'Unknown upstream error',
        },
      });
    }
  };
}
