import type { Request, Response } from 'express';
import { ScorecardClient, sizeBucketToRange } from '../scorecard-client.js';
import {
  FindByCriteriaInputSchema,
  SchoolListResultSchema,
  SOURCE_LITERAL,
} from '../schemas.js';
import { toSummary } from '../transform.js';
import { badRequest, upstreamError, asyncHandler } from '../http-helpers.js';

const ownershipCode = {
  public: 1,
  private_nonprofit: 2,
  private_for_profit: 3,
} as const;

const degreeTypeCode = {
  certificate: 1,
  associate: 2,
  bachelor: 3,
  graduate: 4,
} as const;

export function findByCriteriaHandler(client: ScorecardClient) {
  return asyncHandler(async (req: Request, res: Response) => {
    const parsed = FindByCriteriaInputSchema.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, parsed.error);
      return;
    }
    const {
      state,
      max_net_price,
      min_grad_rate,
      size,
      ownership,
      degree_type,
      limit,
    } = parsed.data;

    const params: Record<string, string | number> = {
      fields: ScorecardClient.SUMMARY_FIELDS,
      per_page: limit,
      sort: 'latest.completion.rate_suppressed.overall:desc',
    };

    if (state) params['school.state'] = state;
    if (max_net_price !== undefined) {
      params['latest.cost.avg_net_price.overall__range'] = `0..${max_net_price}`;
    }
    if (min_grad_rate !== undefined) {
      params['latest.completion.rate_suppressed.overall__range'] =
        `${min_grad_rate}..1`;
    }
    if (size) params['latest.student.size__range'] = sizeBucketToRange(size);
    if (ownership) params['school.ownership'] = ownershipCode[ownership];
    if (degree_type) {
      params['school.degrees_awarded.predominant'] = degreeTypeCode[degree_type];
    }

    try {
      const raw = await client.query(params);
      const schools = raw.results.map(toSummary);

      // Build applied_filters explicitly — keeps the response contract
      // independent of the input schema.
      const applied_filters: Record<string, unknown> = { limit };
      if (state) applied_filters['state'] = state;
      if (max_net_price !== undefined) applied_filters['max_net_price'] = max_net_price;
      if (min_grad_rate !== undefined) applied_filters['min_grad_rate'] = min_grad_rate;
      if (size) applied_filters['size'] = size;
      if (ownership) applied_filters['ownership'] = ownership;
      if (degree_type) applied_filters['degree_type'] = degree_type;

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
