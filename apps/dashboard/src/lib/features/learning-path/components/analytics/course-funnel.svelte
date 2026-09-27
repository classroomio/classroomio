<script lang="ts">
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import AwardIcon from '@lucide/svelte/icons/award';
  import { t } from '$lib/utils/functions/translations';
  import type { PathAnalyticsFunnelRow } from '../../utils/types';

  interface Props {
    funnel: PathAnalyticsFunnelRow[];
    enrolled: number;
  }

  let { funnel, enrolled }: Props = $props();

  const biggestDrop = $derived(Math.max(0, ...funnel.map((f) => f.droppedAfterPrevious)));
</script>

<div>
  {#each funnel as course, index (course.learningPathCourseId)}
    <div class="grid grid-cols-[30px_1fr] items-center gap-[14px] py-[10px]">
      <span
        class="ui:bg-primary/10 ui:text-primary flex size-[26px] items-center justify-center rounded-full text-xs font-semibold tabular-nums"
      >
        {course.order}
      </span>
      <div class="min-w-0">
        <div class="mb-[6px] flex items-baseline justify-between gap-[10px]">
          <span class="ui:text-foreground min-w-0 truncate text-[13.5px] font-medium">{course.title}</span>
          <span class="ui:text-muted-foreground shrink-0 text-[12.5px] tabular-nums">
            <b class="ui:text-foreground font-semibold">{course.completedCount}</b>
            {$t('learningPath.analytics.funnel.completed')}
            ·
            {course.inProgressCount}
            {$t('learningPath.analytics.funnel.in_progress')}
          </span>
        </div>

        <div class="ui:bg-primary/10 relative h-[22px] overflow-hidden rounded-sm">
          {#if course.completedCount > 0}
            <span
              class="{(course.certificatesAwarded ?? 0) > 0
                ? 'bg-green-600'
                : 'ui:bg-primary'} ui:text-primary-foreground absolute inset-y-0 left-0 flex items-center justify-end rounded-sm pr-2 text-[11.5px] font-semibold"
              style="width: {enrolled > 0 ? Math.round((course.completedCount / enrolled) * 100) : 0}%"
            >
              {course.completedCount}
            </span>
          {/if}
        </div>

        {#if course.droppedAfterPrevious > 0}
          <p
            class="mt-[5px] flex items-center gap-[5px] text-xs font-light {course.droppedAfterPrevious === biggestDrop
              ? 'ui:text-destructive'
              : 'ui:text-muted-foreground'}"
          >
            <ArrowDownIcon size={12} class="custom" />
            {$t('learningPath.analytics.funnel.drop', { count: course.droppedAfterPrevious, n: course.order - 1 })}
            {#if course.droppedAfterPrevious === biggestDrop}
              — {$t('learningPath.analytics.funnel.biggest_drop')}
            {/if}
          </p>
        {/if}

        {#if index === funnel.length - 1 && (course.certificatesAwarded ?? 0) > 0}
          <p class="mt-[5px] flex items-center gap-[5px] text-xs font-light text-green-600">
            <AwardIcon size={12} class="custom" />
            {$t('learningPath.analytics.funnel.certificates', { count: course.certificatesAwarded ?? 0 })}
          </p>
        {/if}
      </div>
    </div>
  {/each}
</div>
