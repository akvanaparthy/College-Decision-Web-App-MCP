const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

// Scorecard fields chosen so that the same field used for filtering is also
// used for display — avoids "I asked for under $30k but the result shows $45k"
// confusion. avg_net_price.overall is literally what students pay after aid
// (the standard "net price" metric); rate_suppressed.overall is Scorecard's
// canonical completion rate. Both are filterable per the data dictionary.
const SUMMARY_FIELDS = [
  'id',
  'school.name',
  'school.state',
  'school.city',
  'school.school_url',
  'school.ownership',
  'latest.student.size',
  'latest.cost.avg_net_price.overall',
  'latest.admissions.admission_rate.overall',
  'latest.completion.rate_suppressed.overall',
];

const PROFILE_FIELDS = [
  ...SUMMARY_FIELDS,
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.earnings.10_yrs_after_entry.median',
  'latest.aid.median_debt.completers.overall',
];

export interface ScorecardResponse {
  metadata: { page: number; total: number; per_page: number };
  results: Record<string, unknown>[];
}

export type ScorecardQueryParams = Record<string, string | number>;

/**
 * Thin client for the College Scorecard API.
 *
 * Responsibilities:
 *  - Hold the API key and inject it into every request as a query param.
 *  - Time out after a configurable deadline so we never hang the tool route.
 *  - Sanitize errors so the API key never leaves this module.
 *
 * The full URL contains the api_key in the query string; we deliberately
 * avoid logging or returning that URL anywhere.
 */
export class ScorecardClient {
  static readonly SUMMARY_FIELDS = SUMMARY_FIELDS.join(',');
  static readonly PROFILE_FIELDS = PROFILE_FIELDS.join(',');

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 8000
  ) {
    if (!apiKey || apiKey === 'your_api_data_gov_key_here') {
      throw new Error(
        'SCORECARD_API_KEY is missing or unconfigured. Set it in mcp-wrapper/.env.'
      );
    }
  }

  async query(params: ScorecardQueryParams): Promise<ScorecardResponse> {
    const url = new URL(BASE_URL);
    url.searchParams.set('api_key', this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        // Sanitize: never leak the URL (contains the api_key)
        throw new Error(
          `Upstream Scorecard API returned ${res.status} ${res.statusText}`
        );
      }
      return (await res.json()) as ScorecardResponse;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(
          `Upstream Scorecard API timed out after ${this.timeoutMs}ms`
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function sizeBucketToRange(
  size: 'small' | 'medium' | 'large'
): string {
  if (size === 'small') return '0..4999';
  if (size === 'medium') return '5000..14999';
  return '15000..';
}
