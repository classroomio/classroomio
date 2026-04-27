import { and, eq, desc } from 'drizzle-orm';
import * as schema from '@db/schema';
import { db } from '@db/drizzle';

const MAX_CONVERSATIONS_PER_COURSE = 50;

export interface ChatConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── List all conversations for a user in a course ───────────────────────────

export async function listChatConversations(courseId: string, userId: string): Promise<ChatConversationSummary[]> {
  try {
    const rows = await db
      .select({
        id: schema.aiChatConversation.id,
        title: schema.aiChatConversation.title,
        createdAt: schema.aiChatConversation.createdAt,
        updatedAt: schema.aiChatConversation.updatedAt
      })
      .from(schema.aiChatConversation)
      .where(and(eq(schema.aiChatConversation.courseId, courseId), eq(schema.aiChatConversation.userId, userId)))
      .orderBy(desc(schema.aiChatConversation.updatedAt))
      .limit(MAX_CONVERSATIONS_PER_COURSE);

    return rows;
  } catch (error) {
    console.error('listChatConversations error:', error);
    throw new Error('Failed to list chat conversations');
  }
}

// ─── Get a single conversation with messages ─────────────────────────────────

export async function getChatConversation(conversationId: string, userId: string) {
  try {
    const [row] = await db
      .select()
      .from(schema.aiChatConversation)
      .where(and(eq(schema.aiChatConversation.id, conversationId), eq(schema.aiChatConversation.userId, userId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getChatConversation error:', error);
    throw new Error('Failed to fetch chat conversation');
  }
}

// ─── Create a new conversation ───────────────────────────────────────────────

export async function createChatConversation(
  courseId: string,
  userId: string,
  title?: string
): Promise<{ id: string; title: string | null }> {
  try {
    const [row] = await db
      .insert(schema.aiChatConversation)
      .values({
        courseId,
        userId,
        title: title || 'New conversation',
        messages: []
      })
      .returning({ id: schema.aiChatConversation.id, title: schema.aiChatConversation.title });

    return row;
  } catch (error) {
    console.error('createChatConversation error:', error);
    throw new Error('Failed to create chat conversation');
  }
}

// ─── Save messages to a conversation ─────────────────────────────────────────

export async function saveChatMessages(conversationId: string, userId: string, messages: unknown[], title?: string) {
  try {
    const updateData: Record<string, unknown> = {
      messages,
      updatedAt: new Date().toISOString()
    };

    if (title) {
      updateData.title = title;
    }

    await db
      .update(schema.aiChatConversation)
      .set(updateData)
      .where(and(eq(schema.aiChatConversation.id, conversationId), eq(schema.aiChatConversation.userId, userId)));
  } catch (error) {
    console.error('saveChatMessages error:', error);
    throw new Error('Failed to save chat messages');
  }
}

// ─── Delete a conversation ───────────────────────────────────────────────────

export async function deleteChatConversation(conversationId: string, userId: string) {
  try {
    await db
      .delete(schema.aiChatConversation)
      .where(and(eq(schema.aiChatConversation.id, conversationId), eq(schema.aiChatConversation.userId, userId)));
  } catch (error) {
    console.error('deleteChatConversation error:', error);
    throw new Error('Failed to delete chat conversation');
  }
}

// ─── Update conversation title ───────────────────────────────────────────────

export async function updateConversationTitle(conversationId: string, userId: string, title: string): Promise<void> {
  try {
    await db
      .update(schema.aiChatConversation)
      .set({ title, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.aiChatConversation.id, conversationId), eq(schema.aiChatConversation.userId, userId)));
  } catch (error) {
    console.error('updateConversationTitle error:', error);
    throw new Error('Failed to update conversation title');
  }
}

// ─── Legacy compat (keep old exports working during migration) ───────────────

export async function getChatHistory(courseId: string, userId: string) {
  const conversations = await listChatConversations(courseId, userId);

  if (conversations.length === 0) return [];

  const latestConversation = await getChatConversation(conversations[0].id, userId);

  return (latestConversation?.messages ?? []) as unknown[];
}

export async function saveChatHistory(courseId: string, userId: string, messages: unknown[]) {
  const conversations = await listChatConversations(courseId, userId);

  if (conversations.length > 0) {
    await saveChatMessages(conversations[0].id, userId, messages);
  } else {
    const newConversation = await createChatConversation(courseId, userId);
    await saveChatMessages(newConversation.id, userId, messages);
  }
}

export async function deleteChatHistory(courseId: string, userId: string) {
  const conversations = await listChatConversations(courseId, userId);

  for (const conversation of conversations) {
    await deleteChatConversation(conversation.id, userId);
  }
}
