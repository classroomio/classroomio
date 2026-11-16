import { tick } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { sidePanel } from '$features/side-panel';
import { courseCommentsApi } from '../api/course-comments.svelte';
import { commentsPanel } from '../store/comments-panel.svelte';
import { getThreadPath } from './anchor-utils';
import { COURSE_COMMENTS_PANEL_ID } from './constants';
import type { CourseCommentThread } from './types';

function revealThreadAnchor(thread: CourseCommentThread) {
  if (!thread.blockId) return;

  const block = document.querySelector(`[data-block-id="${CSS.escape(thread.blockId)}"]`);
  block?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Opens the panel on a thread, marks it read and moves the page to where it is anchored. The
 * panel is course-scoped, so it stays open across the navigation.
 */
export async function goToThread(courseId: string, thread: CourseCommentThread) {
  commentsPanel.openOnThread(thread.id);
  if (sidePanel.activePanelId !== COURSE_COMMENTS_PANEL_ID) sidePanel.open(COURSE_COMMENTS_PANEL_ID);
  void courseCommentsApi.markRead(thread.id);

  const threadPath = getThreadPath(courseId, thread);
  const pathname = threadPath.split('?')[0];
  if (pathname !== page.url.pathname) {
    await goto(threadPath, { keepFocus: true, noScroll: true });
  }

  await tick();
  revealThreadAnchor(thread);
}

/** Opens the thread named in a `?thread=` link, loading it first when it is resolved. */
export async function openLinkedThread(courseId: string, threadId: string) {
  const thread = courseCommentsApi.getThread(threadId) ?? (await courseCommentsApi.refreshThread(threadId));
  if (!thread) return;

  commentsPanel.revealThread(thread);
  await goToThread(courseId, thread);
}
