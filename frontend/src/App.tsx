import { useState } from 'react';
import { Chat } from './components/Chat';
import { ResultsPanel } from './components/ResultsPanel';
import { postChat, AgentApiError } from './lib/api';
import type { ChatMessage, ToolCallRecord } from './lib/types';

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallRecord[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [pendingToolName, setPendingToolName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSend(text: string) {
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setIsPending(true);
    setPendingToolName(null);
    setErrorMessage(null);
    try {
      const res = await postChat(next);
      setMessages([...next, { role: 'assistant', content: res.reply }]);
      setToolCalls(res.tool_calls);
    } catch (err) {
      const detail =
        err instanceof AgentApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unknown error';
      setErrorMessage(detail);
    } finally {
      setIsPending(false);
      setPendingToolName(null);
    }
  }

  return (
    <div className="relative z-10 min-h-screen">
      <Header />
      <main className="mx-auto grid max-w-7xl gap-6 px-6 pb-10 lg:grid-cols-12">
        <div className="surface min-h-[70vh] lg:col-span-5 xl:col-span-5">
          <Chat
            messages={messages}
            isPending={isPending}
            pendingToolName={pendingToolName}
            errorMessage={errorMessage}
            onSend={handleSend}
          />
        </div>
        <div className="lg:col-span-7 xl:col-span-7">
          <ResultsPanel toolCalls={toolCalls} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto max-w-7xl px-6 pb-8 pt-10 lg:pt-14">
      <div className="flex items-baseline justify-between gap-6">
        <div>
          <p className="label-overline mb-2">College Decision Companion</p>
          <h1 className="heading-display text-hero text-balance text-ink">
            Cut through the <em className="not-italic font-display italic text-forest-dark">noise</em>
            <br className="hidden sm:inline" />
            <span className="text-ink-70"> of college selection.</span>
          </h1>
          <p className="mt-4 max-w-prose text-body text-ink-70 leading-relaxed">
            A conversational research assistant powered by the U.S. Department
            of Education's College Scorecard. Ask in plain English; an LLM
            agent picks the right tool and the data comes back as cards,
            comparisons, and ranked lists — not raw JSON.
          </p>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-6 py-8">
      <p className="text-micro text-ink-50">
        Data: U.S. Department of Education College Scorecard (api.data.gov).
        This tool does not provide financial or admissions advice.
      </p>
    </footer>
  );
}
