import type { SchoolListResult } from '../lib/types';
import { formatCount, formatPercent, formatUSD, ownershipDisplay } from '../lib/format';

interface SchoolListProps {
  result: SchoolListResult;
  variant: 'search' | 'criteria';
}

export function SchoolList({ result, variant }: SchoolListProps) {
  const heading =
    variant === 'criteria' ? 'Matching schools' : 'Search results';
  const filterChips = Object.entries(result.applied_filters).filter(
    ([k]) => k !== 'limit'
  );

  return (
    <article className="surface overflow-hidden">
      <header className="border-b border-ink-10 px-6 py-5">
        <p className="label-overline mb-2">{heading}</p>
        <h3 className="heading-display text-title">
          <span className="font-mono text-subhead font-medium text-ink-70">
            {formatCount(result.returned)}
          </span>
          <span className="ml-2 text-ink-50 font-sans text-subhead">
            of {formatCount(result.total_matching)} matching
          </span>
        </h3>
        {filterChips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {filterChips.map(([k, v]) => (
              <li
                key={k}
                className="rounded-sm bg-forest-tint px-2 py-1 font-mono text-micro text-forest-dark"
              >
                {k}: {String(v)}
              </li>
            ))}
          </ul>
        )}
      </header>

      <ol className="divide-y divide-ink-10">
        {result.schools.map((s, i) => {
          const location =
            s.city && s.state ? `${s.city}, ${s.state}` : s.state ?? '—';
          return (
            <li key={s.id} className="px-6 py-5 transition hover:bg-parchment-tint">
              <div className="flex items-start gap-5">
                <span
                  aria-hidden
                  className="font-mono text-subhead font-medium text-ink-30"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="heading-display text-head leading-tight text-ink">
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring underline-offset-2 hover:underline"
                      >
                        {s.name}
                      </a>
                    ) : (
                      s.name
                    )}
                  </h4>
                  <p className="mt-1 text-small text-ink-70">
                    {location}
                    <span className="mx-2 text-ink-30" aria-hidden>·</span>
                    {ownershipDisplay[s.ownership] ?? s.ownership}
                    {s.size !== null && (
                      <>
                        <span className="mx-2 text-ink-30" aria-hidden>·</span>
                        {formatCount(s.size)} students
                      </>
                    )}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-small sm:grid-cols-3">
                    <Stat dt="Net price" dd={formatUSD(s.net_price_year)} />
                    <Stat dt="Grad rate" dd={formatPercent(s.grad_rate)} />
                    <Stat dt="Admit rate" dd={formatPercent(s.admission_rate)} />
                  </dl>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="bg-parchment-tint px-6 py-3">
        <p className="text-micro text-ink-50">Source: {result.source}</p>
      </footer>
    </article>
  );
}

function Stat({ dt, dd }: { dt: string; dd: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-mono text-micro uppercase tracking-wide text-ink-50">
        {dt}
      </dt>
      <dd className="text-small text-ink">{dd}</dd>
    </div>
  );
}
