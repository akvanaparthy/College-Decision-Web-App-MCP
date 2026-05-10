import type {
  SchoolSummary,
  SchoolProfile,
  ComparisonRow,
  Ownership,
} from './schemas.js';
import { SOURCE_LITERAL } from './schemas.js';

// Scorecard returns flat-keyed objects when `fields` is specified.
// Each property is the literal flat key like "school.name" or "latest.cost.attendance.academic_year".
export type RawScorecardSchool = Record<string, unknown>;

const ownershipMap: Record<number, Ownership> = {
  1: 'public',
  2: 'private_nonprofit',
  3: 'private_for_profit',
};

function asNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asIntOrNull(v: unknown): number | null {
  const n = asNumberOrNull(v);
  return n === null ? null : Math.trunc(n);
}

function asStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUrl(v: unknown): string | null {
  const s = asStringOrNull(v);
  if (!s) return null;
  // Reject Scorecard's textual sentinels for missing data.
  const lower = s.toLowerCase();
  if (lower === 'null' || lower === 'none' || lower === 'n/a') return null;
  // Reject anything mailto-shaped or with whitespace.
  if (/[\s@]/.test(s)) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      new URL(s);
      return s;
    } catch {
      return null;
    }
  }
  // Bare domain must contain at least one dot.
  if (!s.includes('.')) return null;
  try {
    new URL(`https://${s}`);
    return `https://${s}`;
  } catch {
    return null;
  }
}

export function toSummary(raw: RawScorecardSchool): SchoolSummary {
  const id = asIntOrNull(raw['id']);
  if (id === null) {
    throw new Error('Scorecard returned a row without a valid integer id');
  }

  const ownershipCode = asNumberOrNull(raw['school.ownership']);
  const ownership: Ownership =
    ownershipCode !== null && ownershipMap[ownershipCode]
      ? ownershipMap[ownershipCode]
      : 'unknown';

  return {
    id,
    name: String(raw['school.name'] ?? 'Unknown school'),
    city: asStringOrNull(raw['school.city']),
    state: asStringOrNull(raw['school.state']),
    ownership,
    size: asIntOrNull(raw['latest.student.size']),
    net_price_year: asNumberOrNull(raw['latest.cost.avg_net_price.overall']),
    admission_rate: asNumberOrNull(raw['latest.admissions.admission_rate.overall']),
    grad_rate: asNumberOrNull(raw['latest.completion.rate_suppressed.overall']),
    url: normalizeUrl(raw['school.school_url']),
  };
}

export function toProfile(raw: RawScorecardSchool): SchoolProfile {
  return {
    ...toSummary(raw),
    tuition_in_state: asNumberOrNull(raw['latest.cost.tuition.in_state']),
    tuition_out_of_state: asNumberOrNull(raw['latest.cost.tuition.out_of_state']),
    median_earnings_10yr: asNumberOrNull(
      raw['latest.earnings.10_yrs_after_entry.median']
    ),
    median_debt: asNumberOrNull(
      raw['latest.aid.median_debt.completers.overall']
    ),
    source: SOURCE_LITERAL,
  };
}

const ownershipDisplay: Record<Ownership, string> = {
  public: 'Public',
  private_nonprofit: 'Private (nonprofit)',
  private_for_profit: 'Private (for-profit)',
  unknown: 'Unknown',
};

export function toComparisonRows(profiles: SchoolProfile[]): ComparisonRow[] {
  const colKey = (p: SchoolProfile) => p.name;

  type Picker = (p: SchoolProfile) => string | number | null;
  const metrics: Array<{ label: string; pick: Picker }> = [
    {
      label: 'Location',
      pick: (p) =>
        p.city && p.state ? `${p.city}, ${p.state}` : (p.state ?? null),
    },
    { label: 'Ownership', pick: (p) => ownershipDisplay[p.ownership] },
    { label: 'Size (students)', pick: (p) => p.size },
    { label: 'Admission rate', pick: (p) => p.admission_rate },
    { label: 'Graduation rate (overall)', pick: (p) => p.grad_rate },
    { label: 'Net price (annual, $)', pick: (p) => p.net_price_year },
    { label: 'Tuition in-state ($)', pick: (p) => p.tuition_in_state },
    { label: 'Tuition out-of-state ($)', pick: (p) => p.tuition_out_of_state },
    {
      label: 'Median earnings 10 yrs after entry ($)',
      pick: (p) => p.median_earnings_10yr,
    },
    { label: 'Median debt of completers ($)', pick: (p) => p.median_debt },
  ];

  return metrics.map(({ label, pick }) => ({
    metric: label,
    values: profiles.reduce<Record<string, string | number | null>>(
      (acc, p) => {
        acc[colKey(p)] = pick(p);
        return acc;
      },
      {}
    ),
  }));
}
