import type { Request, Response } from 'express';
import { ScorecardClient, sizeBucketToRange } from '../scorecard-client.js';
import {
  SearchSchoolsInputSchema,
  SOURCE_LITERAL,
  type SchoolListResult,
} from '../schemas.js';
import { toSummary } from '../transform.js';

export function searchSchoolsHandler(client: ScorecardClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const parsed = SearchSchoolsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'invalid_input', message: parsed.error.message },
      });
      return;
    }
    const { query, state, size, limit } = parsed.data;

    const params: Record<string, string | number> = {
      'school.name': query,
      fields: ScorecardClient.SUMMARY_FIELDS,
      per_page: limit,
      sort: 'latest.student.size:desc',
    };
    if (state) params['school.state'] = state;
    if (size) params['latest.student.size__range'] = sizeBucketToRange(size);

    try {
      const raw = await client.query(params);
      const result: SchoolListResult = {
        schools: raw.results.map(toSummary),
        total: raw.metadata.total,
        applied_filters: parsed.data,
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
