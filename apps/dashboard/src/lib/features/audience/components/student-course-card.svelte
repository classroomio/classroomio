<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Separator from '@cio/ui/base/separator';
  import { Badge } from '@cio/ui/base/badge';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

  import { t } from '$lib/utils/functions/translations';
  import type { AudienceAnalyticsCourse } from '../utils/types';

  let {
    course
  }: {
    course: AudienceAnalyticsCourse;
  } = $props();

  function isComplete(c: AudienceAnalyticsCourse): boolean {
    return c.lessons_count > 0 && c.lessons_completed === c.lessons_count;
  }

  function gradeLabel(grade: number | null): string {
    return grade === null ? '—' : `${grade}%`;
  }
</script>

<Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
  <div class="flex items-start gap-3 p-4">
    <div class="h-12 w-16 shrink-0 overflow-hidden rounded-sm">
      {#if course.logo}
        <img src={course.logo} alt="" class="h-full w-full object-cover" />
      {:else}
        <img src="/images/classroomio-course-img-template.jpg" alt="" class="h-full w-full object-cover" />
      {/if}
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex items-start justify-between gap-2">
        <a href={`/courses/${course.id}`} class="line-clamp-1 text-sm font-semibold hover:underline">
          {course.title}
        </a>
        {#if isComplete(course)}
          <Badge variant="success">
            <CircleCheckIcon class="custom" />
            {$t('analytics.completed')}
          </Badge>
        {:else if course.lessons_completed === 0}
          <Badge variant="outline">{$t('audience.user_analytics.not_started')}</Badge>
        {:else}
          <Badge variant="secondary">{$t('audience.user_analytics.in_progress')}</Badge>
        {/if}
      </div>
      <p class="ui:text-muted-foreground line-clamp-2 text-xs">{course.description}</p>
    </div>
  </div>

  <Separator.Root />

  <div class="flex items-center gap-4 px-4 py-3">
    <PercentRingProgress value={course.progress_percentage} />
    <div class="grid flex-1 grid-cols-3 gap-2 text-xs">
      <div class="flex flex-col">
        <span class="ui:text-muted-foreground">{$t('analytics.lessons')}</span>
        <span class="ui:tabular-nums font-medium">{course.lessons_completed}/{course.lessons_count}</span>
      </div>
      <div class="flex flex-col">
        <span class="ui:text-muted-foreground">{$t('analytics.exercises')}</span>
        <span class="ui:tabular-nums font-medium">
          {course.exercises_completed}/{course.exercises_count}
        </span>
      </div>
      <div class="flex flex-col">
        <span class="ui:text-muted-foreground">{$t('analytics.average_grade')}</span>
        <span class="ui:tabular-nums font-medium">{gradeLabel(course.average_grade)}</span>
      </div>
    </div>
  </div>
</Card.Root>
