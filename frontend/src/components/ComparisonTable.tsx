import type { ComparisonResult } from '../lib/types';
import { formatPercent, formatUSD, formatCount } from '../lib/format';

interface ComparisonTableProps {
  result: ComparisonResult;
}

const PERCENT_METRICS = new Set([
  'Admission rate',
  'Graduation rate (overall)',
]);

const COUNT_METRICS = new Set(['Size (students)']);

function formatCellValue(metric: string, value: string | number | null): string {
  if (value === null) return '—';
  if (typeof value === 'string') return value;
  if (PERCENT_METRICS.has(metric)) return formatPercent(value);
  if (COUNT_METRICS.has(metric)) return formatCount(value);
  if (metric.includes('$')) return formatUSD(value);
  return String(value);
}

export function ComparisonTable({ result }: ComparisonTableProps) {
  const schoolNames = result.schools.map((s) => s.name);

  return (
    <article className="surface overflow-hidden">
      <header className="border-b border-ink-10 px-6 py-5">
        <p className="label-overline mb-2">Side-by-side</p>
        <h3 className="heading-display text-title">
          Comparing {schoolNames.length} schools
        </h3>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-body">
          <thead>
            <tr className="border-b border-ink-10 bg-parchment-tint">
              <th
                scope="col"
                className="label-overline w-1/3 px-6 py-4 text-left"
              >
                Metric
              </th>
              {schoolNames.map((name) => (
                <th
                  key={name}
                  scope="col"
                  className="px-5 py-4 text-left font-display text-subhead font-normal text-ink"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rIdx) => (
              <tr
                key={row.metric}
                className={
                  rIdx % 2 === 1 ? 'bg-parchment-tint/40' : 'bg-transparent'
                }
              >
                <th
                  scope="row"
                  className="px-6 py-3 text-left text-small font-medium text-ink-70"
                >
                  {row.metric}
                </th>
                {schoolNames.map((name) => {
                  const v = row.values[name];
                  return (
                    <td key={name} className="px-5 py-3 font-mono text-small text-ink">
                      {formatCellValue(row.metric, v ?? null)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.failures.length > 0 && (
        <div className="border-t border-ink-10 bg-warn/5 px-6 py-3">
          <p className="text-small text-ink-70">
            <span className="font-medium text-warn">
              Some schools could not be retrieved:
            </span>{' '}
            {result.failures
              .map((f) => `id ${f.school_id} (${f.reason})`)
              .join('; ')}
          </p>
        </div>
      )}

      <footer className="bg-parchment-tint px-6 py-3">
        <p className="text-micro text-ink-50">Source: {result.source}</p>
      </footer>
    </article>
  );
}
