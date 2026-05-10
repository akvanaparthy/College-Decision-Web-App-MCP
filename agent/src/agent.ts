import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';

import { SYSTEM_PROMPT } from './prompts.js';
import type { ChatMessage, ChatResponse, ToolCallRecord } from './types.js';

export interface AgentDeps {
  llm: ChatOpenAI;
  tools: StructuredToolInterface[];
  maxIterations?: number;
}

/**
 * Build a single-turn agent runner. The runner is stateless — the frontend
 * sends the full message history each time, and we replay it into LangChain
 * messages, then loop tool calls until the model produces a textual answer
 * (or we hit maxIterations).
 */
export function createAgentRunner(deps: AgentDeps) {
  const { llm, tools } = deps;
  const maxIterations = deps.maxIterations ?? 6;
  const llmWithTools = llm.bindTools(tools);
  const toolByName = new Map(tools.map((t) => [t.name, t]));

  return async function runAgent(
    history: ChatMessage[]
  ): Promise<ChatResponse> {
    const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT)];
    for (const m of history) {
      if (m.role === 'user') messages.push(new HumanMessage(m.content));
      else messages.push(new AIMessage(m.content));
    }

    const toolCalls: ToolCallRecord[] = [];

    for (let i = 0; i < maxIterations; i++) {
      const response = await llmWithTools.invoke(messages);
      messages.push(response);

      const requested = response.tool_calls ?? [];
      if (requested.length === 0) {
        return {
          reply: extractTextContent(response.content),
          tool_calls: toolCalls,
          iterations: i + 1,
        };
      }

      // Execute every requested tool sequentially so order is deterministic
      // in logs and so we don't pile concurrent load on the wrapper.
      for (const call of requested) {
        const start = Date.now();
        const handler = toolByName.get(call.name);
        let resultPayload: unknown;
        let errorMessage: string | undefined;

        if (!handler) {
          errorMessage = `Unknown tool: ${call.name}`;
          resultPayload = { error: errorMessage };
        } else {
          try {
            resultPayload = await handler.invoke(call.args ?? {});
          } catch (err) {
            errorMessage =
              err instanceof Error ? err.message : 'Tool execution failed';
            resultPayload = { error: errorMessage };
          }
        }

        toolCalls.push({
          name: call.name,
          args: call.args ?? {},
          result: resultPayload,
          ...(errorMessage ? { error: errorMessage } : {}),
          duration_ms: Date.now() - start,
        });

        messages.push(
          new ToolMessage({
            content: JSON.stringify(resultPayload),
            tool_call_id: call.id ?? '',
            name: call.name,
          })
        );
      }
    }

    return {
      reply:
        'I reached the maximum number of tool iterations without producing a final answer. Please try rephrasing your question or narrowing the scope.',
      tool_calls: toolCalls,
      iterations: maxIterations,
    };
  };
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    // LangChain message content can be an array of {type:'text', text:'...'}
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (
          part &&
          typeof part === 'object' &&
          'text' in part &&
          typeof (part as { text: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text;
        }
        return '';
      })
      .join('');
  }
  return '';
}
