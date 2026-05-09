import type { Request, Response } from 'express';
import { ScorecardClient } from '../scorecard-client.js';
import { GetSchoolProfileInputSchema } from '../schemas.js';
import { toProfile } from '../transform.js';

export function getSchoolProfileHandler(client: ScorecardClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const parsed = GetSchoolProfileInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'invalid_input', message: parsed.error.message },
      });
      return;
    }
    const { school_id } = parsed.data;

    try {
      const raw = await client.query({
        id: school_id,
        fields: ScorecardClient.PROFILE_FIELDS,
      });
      const first = raw.results[0];
      if (!first) {
        res.status(404).json({
          error: {
            code: 'not_found',
            message: `No school with id ${school_id}`,
          },
        });
        return;
      }
      res.json(toProfile(first));
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
