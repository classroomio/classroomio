<script lang="ts">
  import { IconButton } from '@cio/ui/custom/icon-button';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import { courseApi } from '$features/course/api';
  import { sidePanel } from '$features/side-panel';
  import { t } from '$lib/utils/functions/translations';
  import { courseCommentsApi } from '../api/course-comments.svelte';
  import { COURSE_COMMENTS_PANEL_ID } from '../utils/constants';

  const isOpen = $derived(sidePanel.activePanelId === COURSE_COMMENTS_PANEL_ID);
  const unreadThreads = $derived(courseCommentsApi.summary?.unreadThreads ?? 0);
  const openThreads = $derived(courseCommentsApi.summary?.openTotal ?? 0);
  const badgeCount = $derived(unreadThreads > 0 ? unreadThreads : openThreads);
  const isVisible = $derived(courseCommentsApi.isReadyFor(courseApi.course?.id));
</script>

{#if isVisible}
  <div class="relative">
    <IconButton
      size="icon"
      tooltip={$t('course_comments.header.tooltip')}
      aria-label={$t('course_comments.header.label', { count: unreadThreads })}
      aria-pressed={isOpen}
      testId="course-comments-header-button"
      onclick={() => sidePanel.toggle(COURSE_COMMENTS_PANEL_ID)}
    >
      <MessageSquareIcon class="custom" />
    </IconButton>
    {#if badgeCount > 0}
      <span
        class="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium {unreadThreads >
        0
          ? 'ui:bg-destructive text-white'
          : 'ui:bg-muted ui:text-muted-foreground ui:border-border border'}"
      >
        {badgeCount}
      </span>
    {/if}
  </div>
{/if}
