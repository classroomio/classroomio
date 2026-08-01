import { asc, and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import type { DocCommentAnchor } from '../../schema';
import type { TNewOrgNoteComment, TNewOrgNoteCommentThread, TOrgNoteComment, TOrgNoteCommentThread } from '../../types';

export type NoteCommentRow = TOrgNoteComment & {
  authorFullname: string | null;
  authorAvatarUrl: string | null;
};

export type NoteCommentThreadRow = TOrgNoteCommentThread & {
  creatorFullname: string | null;
  creatorAvatarUrl: string | null;
  comments: NoteCommentRow[];
};

export async function listCommentThreadsByNoteId(docId: string): Promise<NoteCommentThreadRow[]> {
  try {
    const threads = await db
      .select({
        id: schema.orgDocCommentThread.id,
        docId: schema.orgDocCommentThread.docId,
        status: schema.orgDocCommentThread.status,
        anchor: schema.orgDocCommentThread.anchor,
        createdBy: schema.orgDocCommentThread.createdBy,
        authorType: schema.orgDocCommentThread.authorType,
        resolvedAt: schema.orgDocCommentThread.resolvedAt,
        resolvedBy: schema.orgDocCommentThread.resolvedBy,
        createdAt: schema.orgDocCommentThread.createdAt,
        updatedAt: schema.orgDocCommentThread.updatedAt,
        creatorFullname: schema.profile.fullname,
        creatorAvatarUrl: schema.profile.avatarUrl
      })
      .from(schema.orgDocCommentThread)
      .leftJoin(schema.profile, eq(schema.orgDocCommentThread.createdBy, schema.profile.id))
      .where(eq(schema.orgDocCommentThread.docId, docId))
      .orderBy(asc(schema.orgDocCommentThread.createdAt));

    if (threads.length === 0) {
      return [];
    }

    const threadIds = threads.map((thread) => thread.id);

    const comments = await db
      .select({
        id: schema.orgDocComment.id,
        threadId: schema.orgDocComment.threadId,
        authorId: schema.orgDocComment.authorId,
        authorType: schema.orgDocComment.authorType,
        body: schema.orgDocComment.body,
        createdAt: schema.orgDocComment.createdAt,
        updatedAt: schema.orgDocComment.updatedAt,
        deletedAt: schema.orgDocComment.deletedAt,
        authorFullname: schema.profile.fullname,
        authorAvatarUrl: schema.profile.avatarUrl
      })
      .from(schema.orgDocComment)
      .leftJoin(schema.profile, eq(schema.orgDocComment.authorId, schema.profile.id))
      .where(inArray(schema.orgDocComment.threadId, threadIds))
      .orderBy(asc(schema.orgDocComment.createdAt));

    const commentsByThreadId = new Map<string, NoteCommentRow[]>();

    for (const comment of comments) {
      if (comment.deletedAt) {
        continue;
      }

      const existing = commentsByThreadId.get(comment.threadId) ?? [];
      existing.push(comment);
      commentsByThreadId.set(comment.threadId, existing);
    }

    return threads.map((thread) => ({
      ...thread,
      comments: commentsByThreadId.get(thread.id) ?? []
    }));
  } catch (error) {
    console.error('listCommentThreadsByNoteId error:', error);
    throw new Error('Failed to list note comment threads');
  }
}

export async function getCommentThreadById(threadId: string): Promise<TOrgNoteCommentThread | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.orgDocCommentThread)
      .where(eq(schema.orgDocCommentThread.id, threadId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCommentThreadById error:', error);
    throw new Error('Failed to get note comment thread');
  }
}

export async function createCommentThread(params: {
  thread: TNewOrgNoteCommentThread;
  comment: Omit<TNewOrgNoteComment, 'threadId'>;
}): Promise<NoteCommentThreadRow> {
  try {
    return db.transaction(async (tx) => {
      const [thread] = await tx.insert(schema.orgDocCommentThread).values(params.thread).returning();

      if (!thread) {
        throw new Error('Failed to create note comment thread');
      }

      const [comment] = await tx
        .insert(schema.orgDocComment)
        .values({ ...params.comment, threadId: thread.id })
        .returning();

      if (!comment) {
        throw new Error('Failed to create note comment');
      }

      return {
        ...thread,
        creatorFullname: null,
        creatorAvatarUrl: null,
        comments: [
          {
            ...comment,
            authorFullname: null,
            authorAvatarUrl: null
          }
        ]
      };
    });
  } catch (error) {
    console.error('createCommentThread error:', error);
    throw new Error('Failed to create note comment thread');
  }
}

export async function createCommentReply(params: Omit<TNewOrgNoteComment, 'id'>): Promise<TOrgNoteComment> {
  try {
    const [row] = await db.insert(schema.orgDocComment).values(params).returning();

    if (!row) {
      throw new Error('Failed to create note comment reply');
    }

    return row;
  } catch (error) {
    console.error('createCommentReply error:', error);
    throw new Error('Failed to create note comment reply');
  }
}

export async function updateCommentThreadStatus(params: {
  threadId: string;
  status: 'open' | 'resolved';
  resolvedBy?: string | null;
}): Promise<TOrgNoteCommentThread | null> {
  try {
    const [row] = await db
      .update(schema.orgDocCommentThread)
      .set({
        status: params.status,
        resolvedAt: params.status === 'resolved' ? new Date().toISOString() : null,
        resolvedBy: params.status === 'resolved' ? (params.resolvedBy ?? null) : null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.orgDocCommentThread.id, params.threadId))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('updateCommentThreadStatus error:', error);
    throw new Error('Failed to update note comment thread');
  }
}

export async function touchCommentThread(threadId: string) {
  try {
    await db
      .update(schema.orgDocCommentThread)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(schema.orgDocCommentThread.id, threadId));
  } catch (error) {
    console.error('touchCommentThread error:', error);
    throw new Error('Failed to update note comment thread timestamp');
  }
}

export async function getCommentById(commentId: string): Promise<TOrgNoteComment | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.orgDocComment)
      .where(and(eq(schema.orgDocComment.id, commentId), isNull(schema.orgDocComment.deletedAt)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCommentById error:', error);
    throw new Error('Failed to get note comment');
  }
}

export async function updateCommentBody(commentId: string, body: string): Promise<TOrgNoteComment | null> {
  try {
    const [row] = await db
      .update(schema.orgDocComment)
      .set({
        body,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.orgDocComment.id, commentId), isNull(schema.orgDocComment.deletedAt)))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('updateCommentBody error:', error);
    throw new Error('Failed to update note comment');
  }
}

export async function softDeleteComment(commentId: string): Promise<TOrgNoteComment | null> {
  try {
    const [row] = await db
      .update(schema.orgDocComment)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.orgDocComment.id, commentId), isNull(schema.orgDocComment.deletedAt)))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('softDeleteComment error:', error);
    throw new Error('Failed to delete note comment');
  }
}

export async function replaceCommentMentions(commentId: string, profileIds: string[]) {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(schema.orgDocCommentMention).where(eq(schema.orgDocCommentMention.commentId, commentId));

      if (profileIds.length === 0) {
        return;
      }

      await tx.insert(schema.orgDocCommentMention).values(
        profileIds.map((profileId) => ({
          commentId,
          profileId
        }))
      );
    });
  } catch (error) {
    console.error('replaceCommentMentions error:', error);
    throw new Error('Failed to update note comment mentions');
  }
}

export type NoteCommentEmailContext = {
  docId: string;
  docTitle: string;
  threadId: string;
  commentId: string;
  commentBody: string;
  authorFullname: string | null;
  orgName: string;
  orgSiteName: string;
  orgAvatarUrl: string | null;
  orgTheme: string | null;
};

export async function getNoteCommentEmailContext(commentId: string): Promise<NoteCommentEmailContext | null> {
  try {
    const [row] = await db
      .select({
        docId: schema.orgDoc.id,
        docTitle: schema.orgDoc.title,
        threadId: schema.orgDocCommentThread.id,
        commentId: schema.orgDocComment.id,
        commentBody: schema.orgDocComment.body,
        authorFullname: schema.profile.fullname,
        orgName: schema.organization.name,
        orgSiteName: schema.organization.siteName,
        orgAvatarUrl: schema.organization.avatarUrl,
        orgTheme: schema.organization.theme
      })
      .from(schema.orgDocComment)
      .innerJoin(schema.orgDocCommentThread, eq(schema.orgDocComment.threadId, schema.orgDocCommentThread.id))
      .innerJoin(schema.orgDoc, eq(schema.orgDocCommentThread.docId, schema.orgDoc.id))
      .innerJoin(schema.organization, eq(schema.orgDoc.organizationId, schema.organization.id))
      .leftJoin(schema.profile, eq(schema.orgDocComment.authorId, schema.profile.id))
      .where(and(eq(schema.orgDocComment.id, commentId), isNull(schema.orgDocComment.deletedAt)))
      .limit(1);

    if (!row?.orgSiteName) {
      return null;
    }

    return {
      ...row,
      orgSiteName: row.orgSiteName
    };
  } catch (error) {
    console.error('getNoteCommentEmailContext error:', error);
    throw new Error('Failed to get note comment email context');
  }
}

export async function getMentionedProfileEmails(
  profileIds: string[]
): Promise<Array<{ profileId: string; email: string }>> {
  if (profileIds.length === 0) {
    return [];
  }

  try {
    const rows = await db
      .select({
        profileId: schema.profile.id,
        email: schema.profile.email
      })
      .from(schema.profile)
      .where(inArray(schema.profile.id, profileIds));

    return rows.filter((row): row is { profileId: string; email: string } => Boolean(row.email));
  } catch (error) {
    console.error('getMentionedProfileEmails error:', error);
    throw new Error('Failed to get mentioned profile emails');
  }
}

export async function getThreadParticipantEmails(params: {
  threadId: string;
  excludeProfileId: string;
}): Promise<string[]> {
  try {
    const [thread] = await db
      .select({
        createdBy: schema.orgDocCommentThread.createdBy,
        noteOwnerId: schema.orgDoc.ownerId
      })
      .from(schema.orgDocCommentThread)
      .innerJoin(schema.orgDoc, eq(schema.orgDocCommentThread.docId, schema.orgDoc.id))
      .where(eq(schema.orgDocCommentThread.id, params.threadId))
      .limit(1);

    if (!thread) {
      return [];
    }

    const commentAuthors = await db
      .select({
        email: schema.profile.email
      })
      .from(schema.orgDocComment)
      .innerJoin(schema.profile, eq(schema.orgDocComment.authorId, schema.profile.id))
      .where(and(eq(schema.orgDocComment.threadId, params.threadId), isNull(schema.orgDocComment.deletedAt)));

    const ownerEmail = thread.noteOwnerId
      ? await db
          .select({ email: schema.profile.email })
          .from(schema.profile)
          .where(eq(schema.profile.id, thread.noteOwnerId))
          .limit(1)
      : [];

    const creatorEmail = thread.createdBy
      ? await db
          .select({ email: schema.profile.email })
          .from(schema.profile)
          .where(eq(schema.profile.id, thread.createdBy))
          .limit(1)
      : [];

    const excludeProfile = await db
      .select({ email: schema.profile.email })
      .from(schema.profile)
      .where(eq(schema.profile.id, params.excludeProfileId))
      .limit(1);

    const excludedEmail = excludeProfile[0]?.email ?? null;
    const emails = new Set<string>();

    for (const row of [...commentAuthors, ...ownerEmail, ...creatorEmail]) {
      if (row.email && row.email !== excludedEmail) {
        emails.add(row.email);
      }
    }

    return [...emails];
  } catch (error) {
    console.error('getThreadParticipantEmails error:', error);
    throw new Error('Failed to get thread participant emails');
  }
}

export type { DocCommentAnchor };
