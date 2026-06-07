/**
 * Anthropic strictly requires every `tool_use` block to be followed in the very
 * next message by a `tool_result` block with a matching id. OpenAI tolerates
 * mismatches; Anthropic 400s.
 *
 * The break-shapes this catches:
 *   (a) `convertToModelMessages` splits an assistant UIMessage with parts
 *       `[tool-call, text, text]` into TWO assistant ModelMessages plus a tool
 *       message — the wedged second assistant message separates tool_use from
 *       tool_result.
 *   (b) `trimMessageHistory` slices the array between an assistant tool-call
 *       turn and its tool-result message.
 *   (c) A tool call was aborted mid-stream and persisted without a result.
 *
 * Strategy: walk the ModelMessage[] once. For every assistant message that has
 * tool-call parts, **immediately** emit a tool message containing matching
 * tool-result parts — pulled from anywhere later in the array, or synthesized
 * as an error result if missing entirely. Tool messages whose results have
 * already been claimed by an earlier assistant turn are dropped (or trimmed)
 * to avoid duplicates.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type ToolCallPart = { type: 'tool-call' | 'dynamic-tool-call'; toolCallId: string; toolName: string };
type ToolResultPart = {
  type: 'tool-result' | 'dynamic-tool-result';
  toolCallId: string;
  toolName?: string;
  output?: unknown;
};

function isToolCallPart(part: unknown): part is ToolCallPart {
  const type = (part as { type?: unknown })?.type;
  return type === 'tool-call' || type === 'dynamic-tool-call';
}

function isToolResultPart(part: unknown): part is ToolResultPart {
  const type = (part as { type?: unknown })?.type;
  return type === 'tool-result' || type === 'dynamic-tool-result';
}

function syntheticErrorResult(tc: ToolCallPart): ToolResultPart {
  return {
    type: 'tool-result',
    toolCallId: tc.toolCallId,
    toolName: tc.toolName,
    output: { type: 'error-text', value: 'Tool call was interrupted; no result captured.' }
  };
}

/**
 * Anthropic accepts assistant content in the canonical shape `[text*, tool_use*]`
 * (text/reasoning first, then tool_uses at the end). When the assistant content
 * has text AFTER tool_use blocks (`[tool_use, text, text]`), Anthropic's strict
 * validator can reject it with the same "tool_result missing immediately after"
 * error even though the next message IS a tool message — because it doesn't
 * recognise the assistant turn as ending on tool_use. Reorder so tool-calls
 * always come last within each assistant message.
 */
function reorderAssistantContent(content: any[]): any[] {
  const toolCalls: any[] = [];
  const nonToolCalls: any[] = [];

  for (const part of content) {
    if (isToolCallPart(part)) {
      toolCalls.push(part);
    } else {
      nonToolCalls.push(part);
    }
  }

  // Only return a new array if we actually moved something.
  if (toolCalls.length === 0 || nonToolCalls.length === 0) return content;

  return [...nonToolCalls, ...toolCalls];
}

export function sanitizeDanglingToolCalls(messages: any[]): any[] {
  // Pass 1 — index every tool-result we can find anywhere in the conversation,
  // keyed by toolCallId. If duplicates exist, last one wins (most recent).
  const toolResultsByCallId = new Map<string, ToolResultPart>();
  for (const m of messages) {
    if (m?.role !== 'tool' || !Array.isArray(m.content)) continue;

    for (const part of m.content) {
      if (isToolResultPart(part)) {
        toolResultsByCallId.set(part.toolCallId, part);
      }
    }
  }

  // Pass 2 — rebuild. After each assistant message with tool-calls, inject a
  // tool message whose results match those calls in the same order. Skip the
  // original tool messages whose parts we've already claimed. Also reorder
  // assistant content so tool-calls always sit at the END.
  const claimedResultIds = new Set<string>();
  const result: any[] = [];

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];

    // Filter or drop tool messages whose results were already pulled forward.
    if (message?.role === 'tool' && Array.isArray(message.content)) {
      const remaining = message.content.filter(
        (part: unknown) => !isToolResultPart(part) || !claimedResultIds.has(part.toolCallId)
      );
      if (remaining.length > 0) {
        result.push({ ...message, content: remaining });
      }
      continue;
    }

    if (message?.role !== 'assistant' || !Array.isArray(message.content)) {
      result.push(message);
      continue;
    }

    const reorderedContent = reorderAssistantContent(message.content);
    const reorderedMessage = reorderedContent === message.content ? message : { ...message, content: reorderedContent };

    result.push(reorderedMessage);

    const toolCalls = reorderedContent.filter(isToolCallPart);
    if (toolCalls.length === 0) continue;

    const resultParts: ToolResultPart[] = toolCalls.map((tc: ToolCallPart) => {
      claimedResultIds.add(tc.toolCallId);
      const existing = toolResultsByCallId.get(tc.toolCallId);

      return existing ?? syntheticErrorResult(tc);
    });

    result.push({ role: 'tool', content: resultParts });
  }

  return result;
}
