<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import { t } from '$lib/utils/functions/translations';
  import type { ContentProgress } from '$features/course/utils/content';

  interface Props {
    progress: ContentProgress;
    class?: string;
  }

  let { progress, class: className = '' }: Props = $props();
</script>

<div class={className}>
  <div class="flex items-baseline justify-between gap-2">
    <span class="text-xs font-medium">{$t('course.sidebar.progress.title')}</span>
    <span class="ui:text-primary text-xs font-semibold tabular-nums">{progress.percent}%</span>
  </div>
  <Progress value={progress.percent} max={100} class="ui:h-1.5 mt-2" />
  <p class="ui:text-muted-foreground mt-2 truncate text-[11px]">
    {$t('course.sidebar.progress.lessons', {
      completed: progress.lessonsComplete,
      total: progress.lessonsTotal
    })}{#if progress.exercisesTotal > 0}
      · {$t('course.sidebar.progress.exercises', {
        completed: progress.exercisesComplete,
        total: progress.exercisesTotal
      })}{/if}
  </p>
</div>
