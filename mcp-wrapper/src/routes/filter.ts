import type { Request, Response } from 'express';
import { ScorecardClient, sizeBucketToRange } from '../scorecard-client.js';
import {
  FindByCriteriaInputSchema,
  SOURCE_LITERAL,
  type SchoolListResult,
} from '../schemas.js';
import { toSummary } from '../transform.js';

const ownershipCode = {
  public: 1,
  private_nonprofit: 2,
  private_for_profit: 3,
} as const;

export function findByCriteriaHandler(client: ScorecardClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const parsed = FindByCriteriaInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'invalid_input', message: parsed.error.message },
      });
      return;
    }
    const {
      state,
      max_net_price,
      min_grad_rate,
      size,
      ownership,
      limit,
    } = parsed.data;

    const params: Record<string, string | number> = {
      fields: ScorecardClient.SUMMARY_FIELDS,
      per_page: limit,
      // Rank by overall completion rate descending so best-outcome schools surface first.
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
