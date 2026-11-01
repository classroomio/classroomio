import type { CommentThread, NewsfeedComment, NewsfeedCommentPage, ThreadRow } from '@/feature/newsfeed/types/newsfeed';

export const EMPTY_THREAD: CommentThread = {
  byId: {},
  rootIds: [],
  childIds: {},
  hasMoreRoots: false,
  rootCursor: null,
  totalCommentCount: 0
};

function appendUnique(list: number[] | undefined, id: number) {
  if (!list) return [id];
  if (list.includes(id)) return list;

  return [...list, id];
}

/** Folds one API page into the thread. Root pages extend the top level; subtree pages extend `page.rootId`'s replies. */
export function mergeThreadPage(thread: CommentThread, page: NewsfeedCommentPage): CommentThread {
  const byId = { ...thread.byId };
  const childIds = { ...thread.childIds };
  let rootIds = thread.rootIds;
  const isRootPage = page.rootId === null;

  for (const item of page.items) {
    byId[String(item.id)] = item;

    if (item.depth === 0 && isRootPage) {
      rootIds = appendUnique(rootIds, item.id);
      continue;
    }

    if (item.parentId !== null && item.depth > 0) {
      childIds[String(item.parentId)] = appendUnique(childIds[String(item.parentId)], item.id);
    }
  }

  return {
    byId,
    childIds,
    rootIds,
    hasMoreRoots: isRootPage ? page.hasMore : thread.hasMoreRoots,
    rootCursor: isRootPage ? page.nextCursor : thread.rootCursor,
    totalCommentCount: page.totalCommentCount
  };
}

/** Keyset cursor for the next replies of a comment: the oldest reply loaded so far. */
export function childCursorOf(thread: CommentThread, parentId: number) {
  const loaded = thread.childIds[String(parentId)] ?? [];
  if (loaded.length === 0) return undefined;

  return String(Math.min(...loaded));
}

/** Depth-first rows for a flat list, with a "more replies" row wherever the server holds replies not yet loaded. */
export function flattenThread(thread: CommentThread, collapsed: ReadonlySet<number>): ThreadRow[] {
  const rows: ThreadRow[] = [];

  const visit = (id: number, depth: number) => {
    const comment = thread.byId[String(id)];
    if (!comment) return;

    rows.push({ type: 'comment', key: `c${id}`, comment, depth });
    if (collapsed.has(id)) return;

    const children = thread.childIds[String(id)] ?? [];
    children.forEach((childId) => visit(childId, depth + 1));

    const remaining = comment.directReplyCount - children.length;
    if (remaining > 0) rows.push({ type: 'more-replies', key: `m${id}`, parentId: id, depth: depth + 1, remaining });
  };

  thread.rootIds.forEach((id) => visit(id, 0));

  return rows;
}

/** Adds a newly created comment at the top of its parent's replies, or of the thread. */
export function insertComment(thread: CommentThread, comment: NewsfeedComment): CommentThread {
  const key = String(comment.id);
  const byId = { ...thread.byId, [key]: comment };
  const childIds = { ...thread.childIds };
  let rootIds = thread.rootIds;

  if (comment.parentId === null) {
    rootIds = [comment.id, ...rootIds];
  } else {
    const parentKey = String(comment.parentId);
    childIds[parentKey] = [comment.id, ...(childIds[parentKey] ?? [])];
    const parent = byId[parentKey];
    if (parent) {
      byId[parentKey] = {
        ...parent,
        directReplyCount: parent.directReplyCount + 1,
        descendantCount: parent.descendantCount + 1,
        loadedChildCount: parent.loadedChildCount + 1
      };
    }
  }

  return { ...thread, byId, childIds, rootIds, totalCommentCount: thread.totalCommentCount + 1 };
}

/** Removes a comment and its loaded replies; `removedCount` includes replies the client never loaded. */
export function removeComment(thread: CommentThread, commentId: number, removedCount: number): CommentThread {
  const target = thread.byId[String(commentId)];
  if (!target) return thread;

  const byId = { ...thread.byId };
  const childIds = { ...thread.childIds };
  const drop = (id: number) => {
    (childIds[String(id)] ?? []).forEach(drop);
    delete childIds[String(id)];
    delete byId[String(id)];
  };
  drop(commentId);

  let rootIds = thread.rootIds;
  if (target.parentId === null) {
    rootIds = rootIds.filter((id) => id !== commentId);
  } else {
    const parentKey = String(target.parentId);
    childIds[parentKey] = (childIds[parentKey] ?? []).filter((id) => id !== commentId);
    const parent = byId[parentKey];
    if (parent) {
      byId[parentKey] = {
        ...parent,
        directReplyCount: Math.max(0, parent.directReplyCount - 1),
        descendantCount: Math.max(0, parent.descendantCount - removedCount),
        loadedChildCount: Math.max(0, parent.loadedChildCount - 1)
      };
    }
  }

  return {
    ...thread,
    byId,
    childIds,
    rootIds,
    totalCommentCount: Math.max(0, thread.totalCommentCount - removedCount)
  };
}

export function updateCommentContent(thread: CommentThread, commentId: number, content: string): CommentThread {
  const comment = thread.byId[String(commentId)];
  if (!comment) return thread;

  return { ...thread, byId: { ...thread.byId, [String(commentId)]: { ...comment, content } } };
}

const LEADING_REPLY_QUOTE =
  /^\s*<blockquote[^>]*class=(?:"[^"]*\breply-quote\b[^"]*"|'[^']*\breply-quote\b[^']*')[\s\S]*?<\/blockquote>/i;

/** Drops the "Replying to" quote older web replies stored inside the comment body. */
export function stripLegacyReplyQuote(content: string | null | undefined) {
  return (content ?? '').replace(LEADING_REPLY_QUOTE, '').trim();
}
