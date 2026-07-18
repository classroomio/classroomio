import { asc, and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import type { NoteCommentAnchor } from '../../schema';
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

export async function listCommentThreadsByNoteId(noteId: string): Promise<NoteCommentThreadRow[]> {
  try {
    const threads = await db
      .select({
        id: schema.orgNoteCommentThread.id,
        noteId: schema.orgNoteCommentThread.noteId,
        status: schema.orgNoteCommentThread.status,
        anchor: schema.orgNoteCommentThread.anchor,
        createdBy: schema.orgNoteCommentThread.createdBy,
        authorType: schema.orgNoteCommentThread.authorType,
        resolvedAt: schema.orgNoteCommentThread.resolvedAt,
        resolvedBy: schema.orgNoteCommentThread.resolvedBy,
        createdAt: schema.orgNoteCommentThread.createdAt,
        updatedAt: schema.orgNoteCommentThread.updatedAt,
        creatorFullname: schema.profile.fullname,
        creatorAvatarUrl: schema.profile.avatarUrl
      })
      .from(schema.orgNoteCommentThread)
      .leftJoin(schema.profile, eq(schema.orgNoteCommentThread.createdBy, schema.profile.id))
      .where(eq(schema.orgNoteCommentThread.noteId, noteId))
      .orderBy(asc(schema.orgNoteCommentThread.createdAt));

    if (threads.length === 0) {
      return [];
    }

    const threadIds = threads.map((thread) => thread.id);

    const comments = await db
      .select({
        id: schema.orgNoteComment.id,
        threadId: schema.orgNoteComment.threadId,
        authorId: schema.orgNoteComment.authorId,
        authorType: schema.orgNoteComment.authorType,
        body: schema.orgNoteComment.body,
        createdAt: schema.orgNoteComment.createdAt,
        updatedAt: schema.orgNoteComment.updatedAt,
        deletedAt: schema.orgNoteComment.deletedAt,
        authorFullname: schema.profile.fullname,
        authorAvatarUrl: schema.profile.avatarUrl
      })
      .from(schema.orgNoteComment)
      .leftJoin(schema.profile, eq(schema.orgNoteComment.authorId, schema.profile.id))
      .where(inArray(schema.orgNoteComment.threadId, threadIds))
      .orderBy(asc(schema.orgNoteComment.createdAt));

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
      .from(schema.orgNoteCommentThread)
      .where(eq(schema.orgNoteCommentThread.id, threadId))
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
      const [thread] = await tx.insert(schema.orgNoteCommentThread).values(params.thread).returning();

      if (!thread) {
        throw new Error('Failed to create note comment thread');
      }

      const [comment] = await tx
        .insert(schema.orgNoteComment)
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
    const [row] = await db.insert(schema.orgNoteComment).values(params).returning();

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
      .update(schema.orgNoteCommentThread)
      .set({
        status: params.status,
        resolvedAt: params.status === 'resolved' ? new Date().toISOString() : null,
        resolvedBy: params.status === 'resolved' ? (params.resolvedBy ?? null) : null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.orgNoteCommentThread.id, params.threadId))
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
      .update(schema.orgNoteCommentThread)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(schema.orgNoteCommentThread.id, threadId));
  } catch (error) {
    console.error('touchCommentThread error:', error);
    throw new Error('Failed to update note comment thread timestamp');
  }
}

export async function getCommentById(commentId: string): Promise<TOrgNoteComment | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.orgNoteComment)
      .where(and(eq(schema.orgNoteComment.id, commentId), isNull(schema.orgNoteComment.deletedAt)))
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
      .update(schema.orgNoteComment)
      .set({
        body,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.orgNoteComment.id, commentId), isNull(schema.orgNoteComment.deletedAt)))
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
      .update(schema.orgNoteComment)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.orgNoteComment.id, commentId), isNull(schema.orgNoteComment.deletedAt)))
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
      await tx.delete(schema.orgNoteCommentMention).where(eq(schema.orgNoteCommentMention.commentId, commentId));

      if (profileIds.length === 0) {
        return;
      }

      await tx.insert(schema.orgNoteCommentMention).values(
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
  noteId: string;
  noteTitle: string;
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
        noteId: schema.orgNote.id,
        noteTitle: schema.orgNote.title,
        threadId: schema.orgNoteCommentThread.id,
        commentId: schema.orgNoteComment.id,
        commentBody: schema.orgNoteComment.body,
        authorFullname: schema.profile.fullname,
        orgName: schema.organization.name,
        orgSiteName: schema.organization.siteName,
        orgAvatarUrl: schema.organization.avatarUrl,
        orgTheme: schema.organization.theme
      })
      .from(schema.orgNoteComment)
      .innerJoin(schema.orgNoteCommentThread, eq(schema.orgNoteComment.threadId, schema.orgNoteCommentThread.id))
      .innerJoin(schema.orgNote, eq(schema.orgNoteCommentThread.noteId, schema.orgNote.id))
      .innerJoin(schema.organization, eq(schema.orgNote.organizationId, schema.organization.id))
      .leftJoin(schema.profile, eq(schema.orgNoteComment.authorId, schema.profile.id))
      .where(and(eq(schema.orgNoteComment.id, commentId), isNull(schema.orgNoteComment.deletedAt)))
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
        createdBy: schema.orgNoteCommentThread.createdBy,
        noteOwnerId: schema.orgNote.ownerId
      })
      .from(schema.orgNoteCommentThread)
      .innerJoin(schema.orgNote, eq(schema.orgNoteCommentThread.noteId, schema.orgNote.id))
      .where(eq(schema.orgNoteCommentThread.id, params.threadId))
      .limit(1);

    if (!thread) {
      return [];
    }

    const commentAuthors = await db
      .select({
        email: schema.profile.email
      })
      .from(schema.orgNoteComment)
      .innerJoin(schema.profile, eq(schema.orgNoteComment.authorId, schema.profile.id))
      .where(and(eq(schema.orgNoteComment.threadId, params.threadId), isNull(schema.orgNoteComment.deletedAt)));

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

export type { NoteCommentAnchor };
