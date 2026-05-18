import { randomUUID } from 'node:crypto';

import { AppError } from '@api/utils/errors';
import { ErrorCodes } from '@cio/utils/constants';
import { getChatConversation, saveChatMessages } from '@api/services/agent/chat-history';
import { summarizeConversation, type SummarizeOptions } from '@api/services/agent/summarize';

export async function compactConversation(conversationId: string, userId: string): Promise<{ messages: unknown[] }> {
  const conversation = await getChatConversation(conversationId, userId);

  if (!conversation) {
    throw new AppError('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
  }

  const storedMessages = (conversation.messages ?? []) as unknown[];

  if (storedMessages.length === 0) {
    throw new AppError('No messages to compact', ErrorCodes.NO_MESSAGES_TO_COMPACT, 400);
  }

  const summary = await summarizeConversation({ messages: storedMessages as SummarizeOptions['messages'] });

  const seed = {
    id: randomUUID(),
    role: 'user' as const,
    parts: [{ type: 'text' as const, text: summary }],
    metadata: {
      compaction: {
        compactedAt: new Date().toISOString(),
        originalMessageCount: storedMessages.length
      }
    }
  };

  await saveChatMessages(conversationId, userId, [seed]);

  return { messages: [seed] };
}
