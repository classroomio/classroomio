<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Empty } from '@cio/ui/custom/empty';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { courseApi } from '$features/course/api';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import { sidePanel } from '$features/side-panel';
  import { t } from '$lib/utils/functions/translations';
  import { courseCommentsApi } from '../api/course-comments.svelte';
  import { commentsPanel } from '../store/comments-panel.svelte';
  import { getDraftChipLabel } from '../utils/anchor-utils';
  import {
    groupThreadsByPage,
    matchesBlockFilter,
    matchesPeopleFilter,
    matchesStatusFilter,
    sortThreads
  } from '../utils/filter-utils';
  import CommentsFilterMenu from './comments-filter-menu.svelte';
  import CommentsNewThread from './comments-new-thread.svelte';
  import CommentsThread from './comments-thread.svelte';

  const courseId = $derived(courseApi.course?.id ?? '');
  const threads = $derived(courseCommentsApi.threads);
  const openCount = $derived(courseCommentsApi.summary?.openTotal ?? 0);
  const hasUnread = $derived((courseCommentsApi.summary?.unreadThreads ?? 0) > 0);
  const pageOrder = $derived(
    getOrderedNavigableContent(courseApi.course).map((item) => ({ id: item.id, title: item.title ?? '' }))
  );
  const visibleThreads = $derived(
    sortThreads(
      (threads ?? []).filter(
        (thread) =>
          thread.id === commentsPanel.activeThreadId ||
          (matchesStatusFilter(thread, commentsPanel.status) &&
            matchesPeopleFilter(thread, commentsPanel.people) &&
            matchesBlockFilter(thread, commentsPanel.blockFilter))
      )
    )
  );
  const groups = $derived(groupThreadsByPage(visibleThreads, pageOrder));
  const blockFilterLabel = $derived.by(() => {
    const blockFilter = commentsPanel.blockFilter;
    if (!blockFilter) return null;

    const label = getDraftChipLabel(
      { type: 'block', lessonId: blockFilter.lessonId, blockId: blockFilter.blockId },
      blockFilter.blockType
    );

    return $t('course_comments.panel.block_filter', { block: label, count: visibleThreads.length });
  });
  const isLoadingResolved = $derived(commentsPanel.status.resolved && !courseCommentsApi.resolvedLoaded);

  function close() {
    sidePanel.close();
  }

  function startCourseComment() {
    commentsPanel.clearBlockFilter();
    commentsPanel.startDraft({ type: 'course' });
  }

  function isTypingTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    );
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented || isTypingTarget(event.target)) return;
    if (document.querySelector('[data-slot="dropdown-menu-content"], [role="dialog"][data-state="open"]')) return;

    close();
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="flex min-h-0 flex-1 flex-col" data-testid="course-comments-panel">
  <header class="ui:border-border border-b px-4 py-3">
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <MessageSquareIcon size={18} class="ui:text-primary shrink-0" />
        <h2 class="text-sm font-semibold">{$t('course_comments.panel.title')}</h2>
      </div>
      <div class="flex items-center gap-1">
        <IconButton
          size="icon-sm"
          tooltip={$t('course_comments.panel.new_comment')}
          aria-label={$t('course_comments.panel.new_comment')}
          onclick={startCourseComment}
          testId="course-comments-new"
        >
          <PlusIcon class="size-4" />
        </IconButton>
        <CommentsFilterMenu />
        <IconButton
          size="icon-sm"
          tooltip={$t('course_comments.panel.close')}
          aria-label={$t('course_comments.panel.close')}
          onclick={close}
        >
          <XIcon class="size-4" />
        </IconButton>
      </div>
    </div>
    <p class="ui:text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs">
      <span>{$t('course_comments.panel.subtitle', { count: openCount })}</span>
      {#if hasUnread}
        <button
          type="button"
          class="hover:ui:text-foreground underline-offset-2 hover:underline"
          onclick={() => void courseCommentsApi.markAllRead()}
        >
          {$t('course_comments.panel.mark_all_read')}
        </button>
      {/if}
    </p>
  </header>

  <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
    {#if blockFilterLabel}
      <div class="flex items-center justify-between px-1.5 pt-2.5 pb-1.5 text-xs font-semibold">
        <span>{blockFilterLabel}</span>
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" onclick={() => commentsPanel.clearBlockFilter()}>
          {$t('course_comments.panel.show_all')}
        </Button>
      </div>
    {/if}

    {#if commentsPanel.draft}
      <CommentsNewThread draft={commentsPanel.draft} />
    {/if}

    {#if threads === null}
      {#each [0, 1, 2] as index (index)}
        <div class="ui:border-border flex flex-col gap-2 border-b py-4">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-10 w-full" />
        </div>
      {/each}
    {:else if groups.length === 0 && !commentsPanel.draft && !isLoadingResolved}
      <Empty title={$t('course_comments.panel.empty')} icon={MessageSquareIcon} class="mt-10" />
    {:else}
      {#each groups as group (group.key)}
        <h3 class="ui:text-muted-foreground mt-4 mb-1 text-xs font-semibold tracking-wide uppercase">
          {group.title ?? $t('course_comments.panel.general')}
        </h3>
        {#each group.threads as thread (thread.id)}
          <CommentsThread {courseId} {thread} />
        {/each}
      {/each}
      {#if isLoadingResolved}
        {#each [0, 1] as index (index)}
          <div class="ui:border-border flex flex-col gap-2 border-b py-4 opacity-60">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-10 w-full" />
          </div>
        {/each}
      {/if}
    {/if}
  </div>
</div>
