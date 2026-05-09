import { describe, it, expect } from 'vitest';
import { toSummary, toProfile, toComparisonRows } from './transform.js';
import type { SchoolProfile } from './schemas.js';

const ucbRaw: Record<string, unknown> = {
  id: 110635,
  'school.name': 'University of California-Berkeley',
  'school.state': 'CA',
  'school.city': 'Berkeley',
  'school.school_url': 'www.berkeley.edu',
  'school.ownership': 1,
  'latest.student.size': 30000,
  'latest.cost.avg_net_price.overall': 17000,
  'latest.admissions.admission_rate.overall': 0.17,
  'latest.completion.rate_suppressed.overall': 0.9284,
  'latest.cost.tuition.in_state': 14000,
  'latest.cost.tuition.out_of_state': 44000,
  'latest.earnings.10_yrs_after_entry.median': 80000,
  'latest.aid.median_debt.completers.overall': 13000,
};

describe('toSummary', () => {
  it('maps a fully-populated raw school to SchoolSummary', () => {
    const result = toSummary(ucbRaw);
    expect(result).toEqual({
      id: 110635,
      name: 'University of California-Berkeley',
      city: 'Berkeley',
      state: 'CA',
      ownership: 'public',
      size: 30000,
      net_price_year: 17000,
      admission_rate: 0.17,
      grad_rate: 0.9284,
      url: 'https://www.berkeley.edu',
    });
  });

  it('returns "unknown" ownership when the code is missing or unrecognized', () => {
    const noOwnership = toSummary({ ...ucbRaw, 'school.ownership': null });
    expect(noOwnership.ownership).toBe('unknown');
    const badOwnership = toSummary({ ...ucbRaw, 'school.ownership': 99 });
    expect(badOwnership.ownership).toBe('unknown');
  });

  it('handles null numeric fields without throwing', () => {
    const result = toSummary({
      id: 1,
      'school.name': 'Tiny College',
      'school.state': null,
      'school.city': null,
      'school.school_url': null,
      'school.ownership': null,
      'latest.student.size': null,
      'latest.cost.attendance.academic_year': null,
      'latest.admissions.admission_rate.overall': null,
      'latest.completion.completion_rate_4yr_150nt': null,
    });
    expect(result.size).toBeNull();
    expect(result.net_price_year).toBeNull();
    expect(result.admission_rate).toBeNull();
    expect(result.grad_rate).toBeNull();
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.url).toBeNull();
  });

  it('preserves a fully-qualified url unchanged', () => {
    const result = toSummary({
      ...ucbRaw,
      'school.school_url': 'https://www.berkeley.edu/admissions',
    });
    expect(result.url).toBe('https://www.berkeley.edu/admissions');
  });
});

describe('toProfile', () => {
  it('extends summary with cost / earnings / debt fields', () => {
    const result = toProfile(ucbRaw);
    expect(result.tuition_in_state).toBe(14000);
    expect(result.tuition_out_of_state).toBe(44000);
    expect(result.median_earnings_10yr).toBe(80000);
    expect(result.median_debt).toBe(13000);
    expect(result.source).toBe(
      'U.S. Department of Education College Scorecard'
    );
  });
});

describe('toComparisonRows', () => {
  const ucb: SchoolProfile = toProfile(ucbRaw);
  const ucla: SchoolProfile = toProfile({
    ...ucbRaw,
    id: 110662,
    'school.name': 'University of California-Los Angeles',
    'school.city': 'Los Angeles',
    'latest.cost.avg_net_price.overall': 14500,
    'latest.completion.rate_suppressed.overall': 0.9123,
    'latest.earnings.10_yrs_after_entry.median': 75000,
  });

  it('produces one row per metric with values keyed by school name', () => {
    const rows = toComparisonRows([ucb, ucla]);
    expect(rows.map((r) => r.metric)).toEqual([
      'Location',
      'Ownership',
      'Size (students)',
      'Admission rate',
      'Graduation rate (overall)',
      'Net price (annual, $)',
      'Tuition in-state ($)',
      'Tuition out-of-state ($)',
      'Median earnings 10 yrs after entry ($)',
      'Median debt of completers ($)',
    ]);
    const netPrice = rows.find((r) => r.metric === 'Net price (annual, $)');
    expect(netPrice?.values[ucb.name]).toBe(17000);
    expect(netPrice?.values[ucla.name]).toBe(14500);
  });

  it('formats Location and Ownership as display strings', () => {
    const rows = toComparisonRows([ucb, ucla]);
    const loc = rows.find((r) => r.metric === 'Location');
    expect(loc?.values[ucb.name]).toBe('Berkeley, CA');
    expect(loc?.values[ucla.name]).toBe('Los Angeles, CA');
    const ownership = rows.find((r) => r.metric === 'Ownership');
    expect(ownership?.values[ucb.name]).toBe('Public');
  });
});
