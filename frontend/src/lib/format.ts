// Display formatters — kept pure and isolated for easy testing later.

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

const intFormatter = new Intl.NumberFormat('en-US');

export function formatUSD(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  return usdFormatter.format(n);
}

export function formatPercent(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return percentFormatter.format(v);
}

export function formatCount(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return intFormatter.format(v);
}

export const ownershipDisplay: Record<string, string> = {
  public: 'Public',
  private_nonprofit: 'Private — Nonprofit',
  private_for_profit: 'Private — For-profit',
  unknown: 'Unknown',
};
