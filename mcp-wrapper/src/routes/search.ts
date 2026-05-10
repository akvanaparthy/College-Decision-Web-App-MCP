import type { Request, Response } from 'express';
import { ScorecardClient, sizeBucketToRange } from '../scorecard-client.js';
import {
  SearchSchoolsInputSchema,
  SchoolListResultSchema,
  SOURCE_LITERAL,
} from '../schemas.js';
import { toSummary } from '../transform.js';
import { badRequest, upstreamError, asyncHandler } from '../http-helpers.js';

export function searchSchoolsHandler(client: ScorecardClient) {
  return asyncHandler(async (req: Request, res: Response) => {
    const parsed = SearchSchoolsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, parsed.error);
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
      const schools = raw.results.map(toSummary);
      // Build applied_filters explicitly so the response contract is stable
      // independent of the input schema.
      const applied_filters: Record<string, unknown> = { query, limit };
      if (state) applied_filters['state'] = state;
      if (size) applied_filters['size'] = size;

      const result = SchoolListResultSchema.parse({
        schools,
        total_matching: raw.metadata.total,
        returned: schools.length,
        applied_filters,
        source: SOURCE_LITERAL,
      });
      res.json(result);
    } catch (err) {
      upstreamError(res, err);
    }
  });
}
