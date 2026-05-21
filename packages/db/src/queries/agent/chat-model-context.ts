import { and, eq } from 'drizzle-orm';
import * as schema from '@db/schema';
import { db } from '@db/drizzle';

export interface ChatModelContextInput {
  conversationId: string;
  courseId: string;
  userId: string;
  modelSummary?: string;
  compactedThroughMessageId?: string | null;
  sourceIds?: string[];
}

export async function getChatModelContext(conversationId: string, userId: string) {
  try {
    const [row] = await db
      .select()
      .from(schema.aiChatModelContext)
      .where(
        and(eq(schema.aiChatModelContext.conversationId, conversationId), eq(schema.aiChatModelContext.userId, userId))
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getChatModelContext error:', error);
    throw new Error('Failed to fetch chat model context');
  }
}

export async function upsertChatModelContext(input: ChatModelContextInput) {
  try {
    const now = new Date().toISOString();

    const [row] = await db
      .insert(schema.aiChatModelContext)
      .values({
        conversationId: input.conversationId,
        courseId: input.courseId,
        userId: input.userId,
        modelSummary: input.modelSummary ?? '',
        compactedThroughMessageId: input.compactedThroughMessageId ?? null,
        sourceIds: input.sourceIds ?? [],
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.aiChatModelContext.conversationId,
        set: {
          courseId: input.courseId,
          userId: input.userId,
          modelSummary: input.modelSummary ?? '',
          compactedThroughMessageId: input.compactedThroughMessageId ?? null,
          sourceIds: input.sourceIds ?? [],
          updatedAt: now
        }
      })
      .returning();

    return row;
  } catch (error) {
    console.error('upsertChatModelContext error:', error);
    throw new Error('Failed to save chat model context');
  }
}

export async function appendConversationSourceIds(conversationId: string, userId: string, sourceIds: string[]) {
  try {
    const existing = await getChatModelContext(conversationId, userId);
    if (!existing) return null;

    const mergedSourceIds = Array.from(new Set([...(existing.sourceIds ?? []), ...sourceIds]));
    const [row] = await db
      .update(schema.aiChatModelContext)
      .set({ sourceIds: mergedSourceIds, updatedAt: new Date().toISOString() })
      .where(
        and(eq(schema.aiChatModelContext.conversationId, conversationId), eq(schema.aiChatModelContext.userId, userId))
      )
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('appendConversationSourceIds error:', error);
    throw new Error('Failed to update chat model context sources');
  }
}
