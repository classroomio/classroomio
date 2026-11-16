<script lang="ts">
  import { IconButton } from '@cio/ui/custom/icon-button';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import { courseApi } from '$features/course/api';
  import { sidePanel } from '$features/side-panel';
  import { t } from '$lib/utils/functions/translations';
  import { courseCommentsApi } from '../api/course-comments.svelte';
  import { commentsPanel } from '../store/comments-panel.svelte';
  import { COURSE_COMMENTS_PANEL_ID } from '../utils/constants';

  interface Props {
    lessonId?: string;
    exerciseId?: string;
  }

  let { lessonId, exerciseId }: Props = $props();

  const pageId = $derived(lessonId ?? exerciseId ?? '');
  const openCount = $derived(courseCommentsApi.summary?.pages[pageId]?.open ?? 0);
  const isVisible = $derived(Boolean(pageId) && courseCommentsApi.isReadyFor(courseApi.course?.id));

  function startPageComment() {
    commentsPanel.clearBlockFilter();
    commentsPanel.startDraft({ type: 'page', page: lessonId ? { lessonId } : { exerciseId } });
    if (sidePanel.activePanelId !== COURSE_COMMENTS_PANEL_ID) sidePanel.open(COURSE_COMMENTS_PANEL_ID);
  }
</script>

{#if isVisible}
  <div class="relative">
    <IconButton
      tooltip={$t('course_comments.page.tooltip')}
      aria-label={$t('course_comments.page.label', { count: openCount })}
      testId="course-comments-page-button"
      onclick={startPageComment}
    >
      <MessageSquareIcon class="custom" />
    </IconButton>
    {#if openCount > 0}
      <span
        class="ui:bg-muted ui:text-muted-foreground ui:border-border pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[10px] font-medium"
      >
        {openCount}
      </span>
    {/if}
  </div>
{/if}
