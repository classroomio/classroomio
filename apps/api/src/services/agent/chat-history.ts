import {
  listChatConversations,
  getChatConversation,
  createChatConversation,
  saveChatMessages as saveDbChatMessages,
  deleteChatConversation,
  updateConversationTitle,
  getChatHistory,
  saveChatHistory as saveDbChatHistory,
  deleteChatHistory
} from '@cio/db/queries/agent';

const MAX_PERSISTED_TOOL_OUTPUT_CHARS = 2000;
const DROPPED_PART_TYPES = new Set(['step-start', 'reasoning']);
const TOOLS_WITH_FULL_OUTPUT = new Set(['generate_course_plan', 'ask_template_questions', 'fetch_documentation_url']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function serializeValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function getToolName(part: Record<string, unknown>): string | null {
  const type = part.type;

  if (type === 'tool-invocation') {
    const toolInvocation = part.toolInvocation;

    return isRecord(toolInvocation) && typeof toolInvocation.toolName === 'string' ? toolInvocation.toolName : null;
  }

  if (typeof type === 'string' && type.startsWith('tool-')) {
    return type.slice(5);
  }

  return null;
}

function buildTruncatedOutput(output: unknown): unknown {
  const serialized = serializeValue(output);

  if (serialized.length <= MAX_PERSISTED_TOOL_OUTPUT_CHARS) {
    return output;
  }

  const preview = serialized.slice(0, MAX_PERSISTED_TOOL_OUTPUT_CHARS) + '...[truncated]';

  if (typeof output === 'string') {
    return preview;
  }

  if (!isRecord(output)) {
    return preview;
  }

  const preservedScalars = Object.fromEntries(
    Object.entries(output).filter(
      ([, value]) => value == null || ['string', 'number', 'boolean'].includes(typeof value)
    )
  );

  return {
    ...preservedScalars,
    truncated: true,
    preview
  };
}

function sanitizeMessagePart(part: unknown): unknown | null {
  if (!isRecord(part)) {
    return part;
  }

  const type = typeof part.type === 'string' ? part.type : '';

  if (DROPPED_PART_TYPES.has(type)) {
    return null;
  }

  const toolName = getToolName(part);

  if (!toolName || TOOLS_WITH_FULL_OUTPUT.has(toolName)) {
    return part;
  }

  if (part.type === 'tool-invocation' && isRecord(part.toolInvocation)) {
    return {
      ...part,
      toolInvocation: {
        ...part.toolInvocation,
        result: buildTruncatedOutput(part.toolInvocation.result)
      }
    };
  }

  if (part.state !== 'output-available' || part.output == null) {
    return part;
  }

  return {
    ...part,
    output: buildTruncatedOutput(part.output)
  };
}

function sanitizeChatMessages(messages: unknown[]): unknown[] {
  return messages.map((message) => {
    if (!isRecord(message) || !Array.isArray(message.parts)) {
      return message;
    }

    const sanitizedParts = message.parts.map(sanitizeMessagePart).filter((part) => part !== null);

    return {
      ...message,
      parts: sanitizedParts
    };
  });
}

export async function saveChatMessages(
  conversationId: string,
  userId: string,
  messages: unknown[],
  title?: string
): Promise<void> {
  await saveDbChatMessages(conversationId, userId, sanitizeChatMessages(messages), title);
}

async function persistChatHistory(courseId: string, userId: string, messages: unknown[]): Promise<void> {
  await saveDbChatHistory(courseId, userId, sanitizeChatMessages(messages));
}

export {
  listChatConversations,
  getChatConversation,
  createChatConversation,
  deleteChatConversation,
  updateConversationTitle,
  // Legacy compat
  getChatHistory as fetchChatHistory,
  persistChatHistory,
  deleteChatHistory as clearChatHistory
};
