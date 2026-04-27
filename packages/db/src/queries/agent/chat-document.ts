import { and, desc, eq, inArray } from 'drizzle-orm';
import * as schema from '@db/schema';
import { db } from '@db/drizzle';

/** Cap on how many documents we keep per conversation. Older ones get pruned on insert. */
const MAX_DOCUMENTS_PER_CONVERSATION = 10;

export interface ChatDocumentRecord {
  id: string;
  conversationId: string;
  courseId: string;
  userId: string;
  assetId: string | null;
  fileName: string;
  mimeType: string;
  text: string;
  wordCount: number;
  pageCount: number | null;
  createdAt: string;
}

export async function createChatDocument(record: {
  id: string;
  conversationId: string;
  courseId: string;
  userId: string;
  assetId: string | null;
  fileName: string;
  mimeType: string;
  text: string;
  wordCount: number;
  pageCount: number | null;
}): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(schema.aiChatDocument).values(record);

      const all = await tx
        .select({ id: schema.aiChatDocument.id })
        .from(schema.aiChatDocument)
        .where(eq(schema.aiChatDocument.conversationId, record.conversationId))
        .orderBy(desc(schema.aiChatDocument.createdAt));

      if (all.length > MAX_DOCUMENTS_PER_CONVERSATION) {
        const toDelete = all.slice(MAX_DOCUMENTS_PER_CONVERSATION).map((row) => row.id);

        await tx.delete(schema.aiChatDocument).where(inArray(schema.aiChatDocument.id, toDelete));
      }
    });
  } catch (error) {
    console.error('createChatDocument error:', error);
    throw new Error('Failed to persist chat document');
  }
}

export async function getChatDocument(documentId: string): Promise<ChatDocumentRecord | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.aiChatDocument)
      .where(eq(schema.aiChatDocument.id, documentId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getChatDocument error:', error);
    throw new Error('Failed to fetch chat document');
  }
}

export async function getChatDocumentsByIds(documentIds: string[]): Promise<ChatDocumentRecord[]> {
  if (documentIds.length === 0) return [];

  try {
    return await db.select().from(schema.aiChatDocument).where(inArray(schema.aiChatDocument.id, documentIds));
  } catch (error) {
    console.error('getChatDocumentsByIds error:', error);
    throw new Error('Failed to fetch chat documents');
  }
}

export async function listChatDocumentsByConversation(
  conversationId: string,
  userId: string
): Promise<ChatDocumentRecord[]> {
  try {
    return await db
      .select()
      .from(schema.aiChatDocument)
      .where(and(eq(schema.aiChatDocument.conversationId, conversationId), eq(schema.aiChatDocument.userId, userId)))
      .orderBy(desc(schema.aiChatDocument.createdAt));
  } catch (error) {
    console.error('listChatDocumentsByConversation error:', error);
    throw new Error('Failed to list chat documents');
  }
}
