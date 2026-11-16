import { SvelteSet } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { COURSE_COMMENTS_CONTENT_VISIBILITY_STORAGE_KEY } from '../utils/constants';
import { DEFAULT_STATUS_FILTER } from '../utils/filter-utils';
import type {
  CourseCommentBlockFilter,
  CourseCommentContentVisibility,
  CourseCommentDraftAnchor,
  CourseCommentStatusFilter
} from '../utils/types';

const DEFAULT_CONTENT_VISIBILITY: CourseCommentContentVisibility = { text: true, time: true, point: true };

function readContentVisibility(): CourseCommentContentVisibility {
  if (!browser) return { ...DEFAULT_CONTENT_VISIBILITY };

  try {
    const stored = localStorage.getItem(COURSE_COMMENTS_CONTENT_VISIBILITY_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_CONTENT_VISIBILITY };

    const parsed = JSON.parse(stored) as Partial<CourseCommentContentVisibility>;

    return {
      text: parsed.text !== false,
      time: parsed.time !== false,
      point: parsed.point !== false
    };
  } catch {
    return { ...DEFAULT_CONTENT_VISIBILITY };
  }
}

class CommentsPanelState {
  status = $state<CourseCommentStatusFilter>({ ...DEFAULT_STATUS_FILTER });
  people = new SvelteSet<string>();
  showOnContent = $state<CourseCommentContentVisibility>(readContentVisibility());
  blockFilter = $state<CourseCommentBlockFilter | null>(null);
  activeThreadId = $state<string | null>(null);
  hoverThreadId = $state<string | null>(null);
  draft = $state<CourseCommentDraftAnchor | null>(null);
  pinMode = $state(false);

  isFiltered = $derived(
    !this.status.unread ||
      !this.status.read ||
      this.status.resolved ||
      this.people.size > 0 ||
      !this.showOnContent.text ||
      !this.showOnContent.time ||
      !this.showOnContent.point
  );

  setOpenFilter(enabled: boolean) {
    this.status.unread = enabled;
    this.status.read = enabled;
  }

  toggleContentVisibility(kind: keyof CourseCommentContentVisibility) {
    this.showOnContent[kind] = !this.showOnContent[kind];

    try {
      localStorage.setItem(COURSE_COMMENTS_CONTENT_VISIBILITY_STORAGE_KEY, JSON.stringify(this.showOnContent));
    } catch {
      return;
    }
  }

  togglePerson(profileId: string) {
    if (this.people.has(profileId)) {
      this.people.delete(profileId);
      return;
    }

    this.people.add(profileId);
  }

  /** Makes a thread visible whatever the filters say, so following a link always lands on it. */
  revealThread(thread: { status: 'open' | 'resolved'; unreadCount: number }) {
    this.people.clear();
    if (thread.status === 'resolved') {
      this.status.resolved = true;
      return;
    }

    if (thread.unreadCount > 0) this.status.unread = true;
    else this.status.read = true;
  }

  openOnThread(threadId: string) {
    this.activeThreadId = threadId;
    this.blockFilter = null;
  }

  openForBlock(blockFilter: CourseCommentBlockFilter, draft: CourseCommentDraftAnchor) {
    this.blockFilter = blockFilter;
    this.activeThreadId = null;
    this.startDraft(draft);
  }

  startDraft(draft: CourseCommentDraftAnchor) {
    this.draft = draft;
    this.pinMode = false;
  }

  clearDraft() {
    this.draft = null;
    this.pinMode = false;
  }

  clearBlockFilter() {
    this.blockFilter = null;
  }

  resetFilters() {
    this.status.unread = DEFAULT_STATUS_FILTER.unread;
    this.status.read = DEFAULT_STATUS_FILTER.read;
    this.status.resolved = DEFAULT_STATUS_FILTER.resolved;
    this.people.clear();
  }

  reset() {
    this.resetFilters();
    this.blockFilter = null;
    this.activeThreadId = null;
    this.hoverThreadId = null;
    this.clearDraft();
  }
}

export const commentsPanel = new CommentsPanelState();
