/**
 * Trims conversation message history to stay within token budget.
 *
 * Strategy:
 * - Always keep the first message (often contains the initial request/document context)
 * - Always keep the last N messages (recent context is most relevant)
 * - Drop middle messages when the array is too long
 *
 * This is a message-count heuristic, not a token counter. Each message averages
 * ~200-500 tokens, so capping at ~40 messages keeps us under ~20K tokens of
 * history, leaving room for the system prompt + document text + LLM response.
 */

const MAX_MESSAGES = 40;
const KEEP_RECENT = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trimMessageHistory(messages: any[]): any[] {
  if (messages.length <= MAX_MESSAGES) {
    return messages;
  }

  const firstMessage = messages[0];
  const recentMessages = messages.slice(-KEEP_RECENT);

  return [firstMessage, ...recentMessages];
}
