import type {
  CourseCommentBlockFilter,
  CourseCommentPageOrder,
  CourseCommentStatusFilter,
  CourseCommentThread,
  CourseCommentThreadGroup
} from './types';
import { COURSE_COMMENTS_GENERAL_GROUP_KEY } from './constants';
import { getThreadPageId } from './anchor-utils';

export const DEFAULT_STATUS_FILTER: CourseCommentStatusFilter = { unread: true, read: true, resolved: false };

export function matchesStatusFilter(thread: CourseCommentThread, status: CourseCommentStatusFilter): boolean {
  if (thread.status === 'resolved') return status.resolved;

  return thread.unreadCount > 0 ? status.unread : status.read;
}

export function matchesPeopleFilter(thread: CourseCommentThread, people: ReadonlySet<string>): boolean {
  if (people.size === 0) return true;

  return thread.comments.some((comment) => comment.author.profileId && people.has(comment.author.profileId));
}

export function matchesBlockFilter(thread: CourseCommentThread, block: CourseCommentBlockFilter | null): boolean {
  if (!block) return true;

  return thread.blockId === block.blockId && getThreadPageId(thread) === block.lessonId;
}

/** Threads grouped as General first, then by lesson or exercise in course order. */
export function groupThreadsByPage(
  threads: CourseCommentThread[],
  pageOrder: CourseCommentPageOrder[]
): CourseCommentThreadGroup[] {
  const byPage = new Map<string, CourseCommentThread[]>();

  for (const thread of threads) {
    const key = getThreadPageId(thread) ?? COURSE_COMMENTS_GENERAL_GROUP_KEY;
    byPage.set(key, [...(byPage.get(key) ?? []), thread]);
  }

  const general = byPage.get(COURSE_COMMENTS_GENERAL_GROUP_KEY) ?? [];
  const groups: CourseCommentThreadGroup[] = [
    { key: COURSE_COMMENTS_GENERAL_GROUP_KEY, title: null, threads: general }
  ];

  for (const page of pageOrder) {
    groups.push({ key: page.id, title: page.title, threads: byPage.get(page.id) ?? [] });
    byPage.delete(page.id);
  }

  byPage.delete(COURSE_COMMENTS_GENERAL_GROUP_KEY);
  for (const [key, pageThreads] of byPage) {
    const location = pageThreads[0]?.location;
    const title = location && location.kind !== 'course' ? location.title : null;
    groups.push({ key, title, threads: pageThreads });
  }

  return groups.filter((group) => group.threads.length > 0);
}

/** Newest activity first. */
export function sortThreads(threads: CourseCommentThread[]): CourseCommentThread[] {
  return [...threads].sort((left, right) => right.lastActivityAt.localeCompare(left.lastActivityAt));
}
