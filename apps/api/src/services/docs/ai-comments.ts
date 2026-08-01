import { randomUUID } from 'node:crypto';
import { createCommentThread, listCommentThreadsByNoteId, type NoteCommentThreadRow } from '@cio/db/queries/docs';
import { getDocById, insertNoteVersion, updateDoc } from '@cio/db/queries/docs';
import { generateNoteAiCommentSuggestions } from '@cio/core/services/agent/doc-comment-review';
import { publishNoteCommentEvent } from '@cio/core/utils/redis/doc-comments-pubsub';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TAiNoteCommentReview, TDocCommentAnchor } from '@cio/utils/validation/docs';
import { assertNoteCommentAccess } from './access';

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wrap the first unmarked occurrence of quotedText in a TipTap-compatible comment mark. */
export function applyCommentMarkToHtml(html: string, threadId: string, quotedText: string): string | null {
  if (!quotedText || html.includes(`data-doc-comment="${threadId}"`)) {
    return null;
  }

  const pattern = new RegExp(escapeRegExp(quotedText));
  const match = pattern.exec(html);

  if (!match || match.index < 0) {
    return null;
  }

  const before = html.slice(0, match.index);
  const after = html.slice(match.index + quotedText.length);
  const openTagsBefore = (before.match(/<span\b[^>]*data-doc-comment=/gi) ?? []).length;
  const closeTagsBefore = (before.match(/<\/span>/gi) ?? []).length;

  // Skip if the match sits inside an existing comment mark span.
  if (openTagsBefore > closeTagsBefore) {
    return null;
  }

  return `${before}<span data-doc-comment="${threadId}" class="doc-comment-mark">${quotedText}</span>${after}`;
}

function buildAnchor(threadId: string, quotedText: string, plainText: string): TDocCommentAnchor {
  const index = plainText.indexOf(quotedText);
  const prefix = index >= 0 ? plainText.slice(Math.max(0, index - 30), index).trim() || undefined : undefined;
  const suffix =
    index >= 0
      ? plainText.slice(index + quotedText.length, index + quotedText.length + 30).trim() || undefined
      : undefined;

  return {
    version: 1,
    threadId,
    quotedText,
    prefix,
    suffix
  };
}

async function persistNoteContent(params: { docId: string; userId: string; content: string; changeSource: string }) {
  const existing = await getDocById(params.docId);

  if (!existing) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  const updated = await updateDoc(params.docId, {
    content: params.content,
    plainText: htmlToPlainText(params.content),
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  await insertNoteVersion({
    docId: params.docId,
    oldContent: existing.content,
    newContent: params.content,
    changedBy: params.userId,
    changeSource: params.changeSource
  });

  return updated;
}

export async function createAiNoteCommentReviewService(
  organizationId: string,
  userId: string,
  roleId: number,
  docId: string,
  data: TAiNoteCommentReview
) {
  const note = await getDocById(docId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  assertNoteCommentAccess({ note, organizationId, userId, roleId });

  if (note.origin !== 'organization') {
    throw new AppError('AI comments are only available on workspace notes', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const suggestions = await generateNoteAiCommentSuggestions({
    noteHtml: data.content,
    docTitle: note.title,
    focusQuotedText: data.focusQuotedText
  });

  if (suggestions.length === 0) {
    return {
      content: data.content,
      createdCount: 0,
      threads: await listCommentThreadsByNoteId(docId)
    };
  }

  let nextContent = data.content;
  const createdThreads: NoteCommentThreadRow[] = [];

  for (const suggestion of suggestions) {
    const threadId = randomUUID();
    const markedContent = applyCommentMarkToHtml(nextContent, threadId, suggestion.quotedText);

    if (!markedContent) {
      continue;
    }

    const plainText = htmlToPlainText(markedContent);
    const anchor = buildAnchor(threadId, suggestion.quotedText, plainText);

    nextContent = markedContent;

    const thread = await createCommentThread({
      thread: {
        id: threadId,
        docId,
        status: 'open',
        anchor,
        createdBy: userId,
        authorType: 'ai'
      },
      comment: {
        authorId: null,
        authorType: 'ai',
        body: suggestion.body
      }
    });

    createdThreads.push(thread);

    await publishNoteCommentEvent(docId, {
      type: 'thread_created',
      threadId: thread.id,
      commentId: thread.comments[0]?.id
    });
  }

  if (createdThreads.length > 0) {
    await persistNoteContent({
      docId,
      userId,
      content: nextContent,
      changeSource: 'ai_comment_review'
    });
  }

  return {
    content: nextContent,
    createdCount: createdThreads.length,
    threads: await listCommentThreadsByNoteId(docId)
  };
}
