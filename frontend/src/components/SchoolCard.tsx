import type { SchoolProfile } from '../lib/types';
import { formatCount, formatPercent, formatUSD, ownershipDisplay } from '../lib/format';

interface SchoolCardProps {
  school: SchoolProfile;
}

export function SchoolCard({ school }: SchoolCardProps) {
  const location =
    school.city && school.state
      ? `${school.city}, ${school.state}`
      : school.state ?? '—';

  return (
    <article className="surface overflow-hidden">
      <header className="border-b border-ink-10 px-6 py-5">
        <p className="label-overline mb-2">School profile</p>
        <h3 className="heading-display text-display text-balance">
          {school.name}
        </h3>
        <p className="mt-2 text-body text-ink-70">
          {location}
          <span className="mx-2 text-ink-30" aria-hidden>·</span>
          {ownershipDisplay[school.ownership] ?? school.ownership}
          {school.size !== null && (
            <>
              <span className="mx-2 text-ink-30" aria-hidden>·</span>
              {formatCount(school.size)} students
            </>
          )}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-px bg-ink-10 sm:grid-cols-3">
        <Stat label="Net price (annual)" value={formatUSD(school.net_price_year)} hero />
        <Stat label="Graduation rate" value={formatPercent(school.grad_rate)} hero />
        <Stat label="Admission rate" value={formatPercent(school.admission_rate)} hero />
        <Stat label="Tuition (in-state)" value={formatUSD(school.tuition_in_state)} />
        <Stat label="Tuition (out-of-state)" value={formatUSD(school.tuition_out_of_state)} />
        <Stat label="Median earnings (10y)" value={formatUSD(school.median_earnings_10yr)} />
        <Stat label="Median debt (completers)" value={formatUSD(school.median_debt)} />
        {school.url && (
          <div className="col-span-2 bg-parchment-tint px-5 py-4 sm:col-span-3">
            <p className="label-overline mb-1">Official site</p>
            <a
              href={school.url}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring text-body text-forest underline-offset-2 hover:underline"
            >
              {school.url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </dl>

      <footer className="bg-parchment-tint px-6 py-3">
        <p className="text-micro text-ink-50">
          Source: {school.source}
        </p>
      </footer>
    </article>
  );
}

function Stat({ label, value, hero = false }: { label: string; value: string; hero?: boolean }) {
  return (
    <div className="bg-parchment-tint px-5 py-4">
      <p className="label-overline">{label}</p>
      <p
        className={
          hero
            ? 'mt-1 font-display text-title text-ink leading-tight'
            : 'mt-1 text-subhead text-ink'
        }
      >
        {value}
      </p>
    </div>
  );
}
