<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import { t } from '$lib/utils/functions/translations';
  import type { ContentProgress } from '$features/course/utils/content';

  interface Props {
    progress?: ContentProgress;
    class?: string;
  }

  let { progress, class: className = '' }: Props = $props();

  const percent = $derived(progress?.percent ?? 0);
  const lessonsComplete = $derived(progress?.lessonsComplete ?? 0);
  const lessonsTotal = $derived(progress?.lessonsTotal ?? 0);
  const exercisesComplete = $derived(progress?.exercisesComplete ?? 0);
  const exercisesTotal = $derived(progress?.exercisesTotal ?? 0);
</script>

<div class={className}>
  <div class="flex items-baseline justify-between gap-2">
    <span class="text-xs font-medium">{$t('course.sidebar.progress.title')}</span>
    <span class="ui:text-primary text-xs font-semibold tabular-nums">{percent}%</span>
  </div>
  <Progress value={percent} max={100} class="mt-2 h-1.5" />
  <p class="ui:text-muted-foreground mt-2 truncate text-[11px]">
    {$t('course.sidebar.progress.lessons', {
      completed: lessonsComplete,
      total: lessonsTotal
    })}{#if exercisesTotal > 0}
      · {$t('course.sidebar.progress.exercises', {
        completed: exercisesComplete,
        total: exercisesTotal
      })}{/if}
  </p>
</div>
