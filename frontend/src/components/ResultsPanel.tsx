import type { ToolCallRecord } from '../lib/types';
import { SchoolCard } from './SchoolCard';
import { SchoolList } from './SchoolList';
import { ComparisonTable } from './ComparisonTable';

interface ResultsPanelProps {
  toolCalls: ToolCallRecord[];
}

/**
 * Render the latest meaningful tool result. We pick the LAST tool call whose
 * result looks renderable — typically that's the answer the user wanted.
 * Auxiliary lookups (e.g., search_schools resolving an id before compare_schools)
 * are still listed in the timeline below so the user can inspect what the agent
 * actually did.
 */
export function ResultsPanel({ toolCalls }: ResultsPanelProps) {
  if (toolCalls.length === 0) {
    return <EmptyResults />;
  }

  // Find the latest renderable result.
  const renderable = [...toolCalls].reverse().find((c) => isRenderable(c));

  return (
    <div className="space-y-6">
      {renderable ? (
        <RenderToolResult call={renderable} />
      ) : (
        <NoRenderableResult />
      )}

      <Timeline calls={toolCalls} />
    </div>
  );
}

function isRenderable(call: ToolCallRecord): boolean {
  if (call.error) return false;
  const r = call.result;
  if (!r || typeof r !== 'object') return false;
  return (
    'schools' in r ||
    'rows' in r ||
    'name' in r // a SchoolProfile
  );
}

function RenderToolResult({ call }: { call: ToolCallRecord }) {
  const r = call.result as Record<string, unknown>;

  if (call.name === 'compare_schools' && Array.isArray(r['rows'])) {
    return <ComparisonTable result={r as never} />;
  }
  if (call.name === 'get_school_profile' && 'tuition_in_state' in r) {
    return <SchoolCard school={r as never} />;
  }
  if (call.name === 'find_schools_by_criteria') {
    return <SchoolList result={r as never} variant="criteria" />;
  }
  if (call.name === 'search_schools') {
    return <SchoolList result={r as never} variant="search" />;
  }
  return <pre className="surface p-4 text-small">{JSON.stringify(r, null, 2)}</pre>;
}

function Timeline({ calls }: { calls: ToolCallRecord[] }) {
  return (
    <details className="surface">
      <summary className="cursor-pointer px-6 py-4 text-small text-ink-70 hover:text-ink">
        <span className="label-overline mr-3">Tool timeline</span>
        <span>{calls.length} call{calls.length !== 1 ? 's' : ''}</span>
      </summary>
      <ol className="border-t border-ink-10 divide-y divide-ink-10">
        {calls.map((c, i) => (
          <li key={i} className="px-6 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono text-small">
                <span className="text-ink-50 mr-2">{String(i + 1).padStart(2, '0')}</span>
                <span className={c.error ? 'text-error' : 'text-forest-dark'}>
                  {c.name}
                </span>
              </p>
              <span className="font-mono text-micro text-ink-50">
                {c.duration_ms}ms
              </span>
            </div>
            <pre className="mt-1 max-h-32 overflow-y-auto font-mono text-micro text-ink-70 scrollbar-thin">
              args: {JSON.stringify(c.args)}
            </pre>
            {c.error && (
              <p className="mt-1 text-micro text-error">error: {c.error}</p>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

function EmptyResults() {
  return (
    <div className="surface flex h-full flex-col items-center justify-center px-8 py-16 text-center">
      <p className="label-overline mb-3">Results panel</p>
      <h3 className="heading-display text-display text-balance text-ink-70">
        Ask a question
        <br />
        to see structured data here.
      </h3>
      <p className="mt-4 max-w-sm text-body text-ink-50 leading-relaxed">
        Cards, comparisons, and ranked lists from the U.S. Department of
        Education's College Scorecard will render in this panel as the agent
        reasons.
      </p>
    </div>
  );
}

function NoRenderableResult() {
  return (
    <div className="surface px-6 py-5">
      <p className="label-overline mb-2">Results</p>
      <p className="text-body text-ink-70">
        The agent answered without retrieving structured data — see the
        conversation panel for the response.
      </p>
    </div>
  );
}
