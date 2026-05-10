import { useState, useRef, useEffect, type FormEvent } from 'react';
import { cn } from '../lib/cn';
import type { ChatMessage } from '../lib/types';

interface ChatProps {
  messages: ChatMessage[];
  isPending: boolean;
  pendingToolName: string | null;
  errorMessage: string | null;
  onSend: (text: string) => void;
}

const SUGGESTED_PROMPTS = [
  'Find me bachelor’s‑degree colleges in California under $30k net price with at least an 80% graduation rate.',
  'Compare UCLA and UC Berkeley side by side.',
  'What is the median earnings 10 years after entry for University of Michigan‑Ann Arbor graduates?',
];

export function Chat({
  messages,
  isPending,
  pendingToolName,
  errorMessage,
  onSend,
}: ChatProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isPending]);

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || isPending) return;
    onSend(text);
    setDraft('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <section
      className="flex h-full flex-col"
      aria-label="Conversation with the College Decision Companion"
    >
      <header className="border-b border-ink-10 px-6 py-5">
        <p className="label-overline">Conversation</p>
        <h2 className="heading-display mt-1 text-subhead">
          Ask, compare, decide.
        </h2>
      </header>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 overflow-y-auto px-6 py-6"
      >
        {messages.length === 0 && <ChatEmptyState onPick={onSend} prompts={SUGGESTED_PROMPTS} />}

        <ul className="space-y-5">
          {messages.map((m, i) => (
            <li key={i} className="animate-fade-up">
              <Bubble role={m.role}>{m.content}</Bubble>
            </li>
          ))}
          {isPending && (
            <li className="animate-fade-up">
              <PendingIndicator toolName={pendingToolName} />
            </li>
          )}
        </ul>

        {errorMessage && (
          <div
            role="alert"
            className="mt-5 rounded border border-error/30 bg-error/5 px-4 py-3 text-small text-error"
          >
            {errorMessage}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-ink-10 bg-parchment-tint px-6 py-4"
      >
        <label className="label-overline mb-2 block" htmlFor="chat-input">
          Your question
        </label>
        <div className="flex items-end gap-3">
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isPending}
            placeholder="e.g., Find me public universities in Texas with strong engineering outcomes."
            className={cn(
              'focus-ring min-h-[3.25rem] flex-1 resize-none rounded-md',
              'border border-ink-10 bg-parchment px-3 py-2 text-body text-ink',
              'placeholder:text-ink-50',
              'disabled:opacity-60'
            )}
          />
          <button
            type="submit"
            disabled={isPending || draft.trim() === ''}
            className={cn(
              'focus-ring rounded-md px-5 py-3 font-medium transition',
              'bg-forest text-parchment hover:bg-forest-dark',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isPending ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        <p className="mt-2 text-micro text-ink-50">
          Press <kbd className="font-mono">Enter</kbd> to send, <kbd className="font-mono">Shift</kbd>+<kbd className="font-mono">Enter</kbd> for a new line.
        </p>
      </form>
    </section>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  if (role === 'user') {
    return (
      <article className="ml-auto max-w-[88%] surface px-4 py-3 text-body bg-forest-tint border-forest/15">
        <p className="label-overline mb-1 text-forest-dark/80">You</p>
        <p className="whitespace-pre-wrap text-ink">{children}</p>
      </article>
    );
  }
  return (
    <article className="mr-auto max-w-[92%] surface px-5 py-4 text-body">
      <p className="label-overline mb-2">Companion</p>
      <p className="whitespace-pre-wrap text-ink leading-relaxed">{children}</p>
    </article>
  );
}

function PendingIndicator({ toolName }: { toolName: string | null }) {
  return (
    <article className="mr-auto max-w-[92%] surface px-5 py-4">
      <p className="label-overline mb-2">Companion</p>
      <div className="flex items-center gap-3 text-ink-70">
        <span className="inline-flex gap-1" aria-hidden>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-50" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-50" style={{ animationDelay: '180ms' }} />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-50" style={{ animationDelay: '360ms' }} />
        </span>
        <span className="text-small">
          {toolName ? <>Calling <span className="font-mono text-forest-dark">{toolName}</span>…</> : 'Thinking…'}
        </span>
      </div>
    </article>
  );
}

function ChatEmptyState({ prompts, onPick }: { prompts: string[]; onPick: (s: string) => void }) {
  return (
    <div className="mx-auto max-w-prose space-y-6 py-8">
      <p className="text-ink-70 leading-relaxed">
        I can search and compare U.S. colleges using public data from the
        Department of Education's College Scorecard. Try one of the questions
        below, or ask your own.
      </p>
      <ul className="space-y-2">
        {prompts.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onPick(p)}
              className={cn(
                'focus-ring group block w-full rounded-md border border-ink-10',
                'bg-parchment-tint px-4 py-3 text-left text-body text-ink-70',
                'transition hover:border-forest/30 hover:bg-forest-tint hover:text-ink'
              )}
            >
              <span className="label-overline mb-1 block group-hover:text-forest-dark/70">
                Try
              </span>
              {p}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
