<script lang="ts">
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { courseCommentsApi } from '../api/course-comments.svelte';

  interface Props {
    pageId: string;
  }

  let { pageId }: Props = $props();

  const count = $derived(
    courseCommentsApi.isReadyFor(courseApi.course?.id) ? courseCommentsApi.summary?.pages[pageId] : undefined
  );
</script>

{#if count && count.open > 0}
  <span
    class="flex shrink-0 items-center gap-1"
    title={$t('course_comments.tree.open_count', { count: count.open })}
    data-testid="course-comments-page-badge"
  >
    {#if count.unread}
      <span class="ui:bg-primary size-1.5 rounded-full" aria-label={$t('course_comments.tree.unread')}></span>
    {/if}
    <span
      class="ui:border-border ui:text-muted-foreground flex h-4 min-w-4 items-center justify-center rounded-full border px-1 font-mono text-[10px] tabular-nums"
    >
      {count.open}
    </span>
  </span>
{/if}
