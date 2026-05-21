import { randomUUID } from 'node:crypto';

import { getChatModelContext, upsertChatModelContext } from '@cio/db/queries/agent';
import { trimMessageHistory } from '@api/services/agent/context-window';
import { summarizeConversationDelta, type SummarizeOptions } from '@api/services/agent/summarize';

const KEEP_RECENT_MESSAGES = 16;
const MIN_MESSAGES_BEFORE_SUMMARY = KEEP_RECENT_MESSAGES + 4;

type AgentMessage = SummarizeOptions['messages'][number] & {
  id?: string;
  metadata?: Record<string, unknown> | null | undefined;
};

export interface BuildModelContextMessagesOptions {
  conversationId?: string;
  courseId: string;
  userId: string;
  messages: AgentMessage[];
}

export interface BuildModelContextMessagesResult {
  messages: AgentMessage[];
  summarized: boolean;
  compactedThroughMessageId?: string | null;
}

function getMessageId(message: AgentMessage | undefined): string | null {
  return typeof message?.id === 'string' && message.id.length > 0 ? message.id : null;
}

function buildSummarySeed(summary: string, compactedThroughMessageId?: string | null): AgentMessage {
  return {
    id: `model-context-summary-${randomUUID()}`,
    role: 'user',
    parts: [
      {
        type: 'text',
        text: `Conversation summary for continuity. Use this as prior context, then continue from the recent messages that follow.\n\n${summary}`
      }
    ],
    metadata: {
      modelContextSummary: {
        compactedThroughMessageId: compactedThroughMessageId ?? null
      }
    }
  };
}

export async function buildModelContextMessages(
  options: BuildModelContextMessagesOptions
): Promise<BuildModelContextMessagesResult> {
  const { conversationId, courseId, userId, messages } = options;

  if (!conversationId || messages.length <= MIN_MESSAGES_BEFORE_SUMMARY) {
    return { messages: trimMessageHistory(messages) as AgentMessage[], summarized: false };
  }

  const existingContext = await getChatModelContext(conversationId, userId);
  const splitIndex = Math.max(0, messages.length - KEEP_RECENT_MESSAGES);
  const messagesToRepresent = messages.slice(0, splitIndex);
  const recentMessages = messages.slice(splitIndex);
  const compactedThroughMessageId = getMessageId(messagesToRepresent[messagesToRepresent.length - 1]);

  if (messagesToRepresent.length === 0) {
    return { messages: trimMessageHistory(messages) as AgentMessage[], summarized: false };
  }

  let modelSummary = existingContext?.modelSummary ?? '';
  let summarized = false;

  if (compactedThroughMessageId && existingContext?.compactedThroughMessageId !== compactedThroughMessageId) {
    const previousCompactedIndex = existingContext?.compactedThroughMessageId
      ? messagesToRepresent.findIndex((message) => getMessageId(message) === existingContext.compactedThroughMessageId)
      : -1;
    const deltaStartIndex = previousCompactedIndex >= 0 ? previousCompactedIndex + 1 : 0;
    const deltaMessages = messagesToRepresent.slice(deltaStartIndex);

    if (deltaMessages.length > 0) {
      modelSummary = await summarizeConversationDelta({
        existingSummary: modelSummary,
        messages: deltaMessages
      });
      summarized = true;
    }

    await upsertChatModelContext({
      conversationId,
      courseId,
      userId,
      modelSummary,
      compactedThroughMessageId,
      sourceIds: existingContext?.sourceIds ?? []
    });
  }

  if (!modelSummary.trim()) {
    return { messages: trimMessageHistory(messages) as AgentMessage[], summarized };
  }

  const contextManagedMessages = [buildSummarySeed(modelSummary, compactedThroughMessageId), ...recentMessages];

  return {
    messages: trimMessageHistory(contextManagedMessages) as AgentMessage[],
    summarized,
    compactedThroughMessageId
  };
}
