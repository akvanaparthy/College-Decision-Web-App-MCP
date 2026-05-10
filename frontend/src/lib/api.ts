import type { ChatMessage, ChatResponse } from './types';

const AGENT_URL =
  (import.meta.env.VITE_AGENT_URL as string | undefined)?.replace(/\/+$/, '') ??
  'http://localhost:4100';

export class AgentApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'AgentApiError';
  }
}

export async function postChat(messages: ChatMessage[]): Promise<ChatResponse> {
  const res = await fetch(`${AGENT_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) detail = body.error.message;
    } catch {
      // body wasn't JSON
    }
    throw new AgentApiError(`Agent error (${res.status}): ${detail}`, res.status);
  }
  return (await res.json()) as ChatResponse;
}
