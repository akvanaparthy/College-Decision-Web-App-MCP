import type { Request, Response } from 'express';
import { ScorecardClient } from '../scorecard-client.js';
import {
  CompareSchoolsInputSchema,
  ComparisonResultSchema,
  SOURCE_LITERAL,
  type SchoolProfile,
  type ComparisonFailure,
} from '../schemas.js';
import { toProfile, toComparisonRows } from '../transform.js';
import { badRequest, asyncHandler } from '../http-helpers.js';

export function compareSchoolsHandler(client: ScorecardClient) {
  return asyncHandler(async (req: Request, res: Response) => {
    const parsed = CompareSchoolsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, parsed.error);
      return;
    }
    const { school_ids } = parsed.data;

    // Fetch each school's profile in parallel. Use allSettled so a single
    // missing/failing id doesn't sink the whole comparison — the agent can
    // still render the schools that succeeded and report what failed.
    const settled = await Promise.allSettled(
      school_ids.map(async (id): Promise<SchoolProfile> => {
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

    const profiles: SchoolProfile[] = [];
    const failures: ComparisonFailure[] = [];
    settled.forEach((s, i) => {
      const id = school_ids[i] as number;
      if (s.status === 'fulfilled') {
        profiles.push(s.value);
      } else {
        failures.push({
          school_id: id,
          reason:
            s.reason instanceof Error
              ? s.reason.message
              : 'Unknown comparison error',
        });
      }
    });

    if (profiles.length === 0) {
      res.status(404).json({
        error: {
          code: 'not_found',
          message: 'None of the requested schools could be retrieved',
          fields: { failures },
        },
      });
      return;
    }

    const result = ComparisonResultSchema.parse({
      schools: profiles,
      rows: toComparisonRows(profiles),
      failures,
      source: SOURCE_LITERAL,
    });
    res.json(result);
  });
}
