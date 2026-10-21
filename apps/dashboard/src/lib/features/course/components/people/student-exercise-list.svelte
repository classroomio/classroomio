<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Empty from '@cio/ui/custom/empty';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import * as Separator from '@cio/ui/base/separator';
  import { Badge } from '@cio/ui/base/badge';
  import { Progress } from '@cio/ui/base/progress';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check-big';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';

  import { STATUS } from '$features/course/components/exercise/constants';
  import { t } from '$lib/utils/functions/translations';
  import type { UserCourseAnalytics } from '$features/course/utils/types';

  let {
    courseId,
    userCourseAnalytics
  }: {
    courseId: string;
    userCourseAnalytics: UserCourseAnalytics;
  } = $props();

  let exercises = $derived(userCourseAnalytics.userExercisesStats);
  let completedExercises = $derived(exercises.filter((exercise) => exercise.isCompleted).length);
  let totalExercises = $derived(exercises.length);
  let exerciseCompletion = $derived(totalExercises === 0 ? 0 : Math.round((completedExercises / totalExercises) * 100));

  function scoreLabel(exercise: (typeof exercises)[number]): string {
    if (exercise.status !== STATUS.GRADED) return `—/${exercise.totalPoints}`;

    return `${exercise.score}/${exercise.totalPoints}`;
  }

  function gradeVariant(score: number, totalPoints: number): 'outline' | 'success' | 'warning' | 'secondary' {
    if (totalPoints <= 0) return 'outline';
    const percent = Math.round((score / totalPoints) * 100);
    if (percent >= 70) return 'success';
    if (percent >= 50) return 'warning';

    return 'secondary';
  }
</script>

<Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
  <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
    <div class="flex items-center gap-2">
      <h2 class="text-sm font-semibold">{$t('analytics.exercises')}</h2>
      <Badge variant="outline" class="ui:tabular-nums">{totalExercises}</Badge>
    </div>
    {#if totalExercises > 0}
      <div class="flex w-full items-center gap-2 sm:w-48">
        <Progress value={exerciseCompletion} class="ui:h-1.5" />
        <span class="ui:tabular-nums ui:text-muted-foreground w-12 shrink-0 text-right text-xs">
          {completedExercises}/{totalExercises}
        </span>
      </div>
    {/if}
  </div>
  <Separator.Root />

  {#if totalExercises === 0}
    <Empty.Root class="ui:py-10">
      <Empty.Header>
        <Empty.Media variant="icon">
          <ListChecksIcon />
        </Empty.Media>
        <Empty.Title>{$t('audience.user_analytics.no_exercises_title')}</Empty.Title>
        <Empty.Description>{$t('audience.user_analytics.no_exercises_description')}</Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else}
    <ResourceListRow.Group class="ui:rounded-none ui:border-0">
      {#each exercises as exercise (exercise.id)}
        <ResourceListRow.Root variant="default" align="start" class="ui:py-3">
          <ResourceListRow.Lead class="ui:self-start">
            <div class="ui:bg-muted ui:text-muted-foreground flex size-9 items-center justify-center rounded-sm">
              <FileTextIcon class="size-4" />
            </div>
          </ResourceListRow.Lead>
          <ResourceListRow.Main class="ui:gap-1">
            <a
              href={`/courses/${courseId}/exercises/${exercise.id}?tab=submissions&submission=individual&student=${encodeURIComponent(userCourseAnalytics.user.id)}`}
              class="line-clamp-1 text-sm font-semibold hover:underline"
            >
              {exercise.title}
            </a>
            {#if exercise.lessonId}
              <a
                href={`/courses/${courseId}/lessons/${exercise.lessonId}`}
                class="ui:text-muted-foreground line-clamp-1 text-xs hover:underline"
              >
                {exercise.lessonTitle}
              </a>
            {:else}
              <span class="ui:text-muted-foreground text-xs">{$t('audience.user_analytics.course_level_exercise')}</span
              >
            {/if}
          </ResourceListRow.Main>
          <ResourceListRow.End class="ui:gap-6 ui:self-start">
            <div class="flex w-20 justify-end">
              {#if exercise.status === STATUS.GRADED}
                <Badge variant={gradeVariant(exercise.score, exercise.totalPoints)} class="ui:tabular-nums">
                  {scoreLabel(exercise)}
                </Badge>
              {:else}
                <span class="ui:tabular-nums ui:text-muted-foreground text-sm">{scoreLabel(exercise)}</span>
              {/if}
            </div>
            <div class="flex w-32 justify-end">
              {#if exercise.status === STATUS.GRADED}
                <Badge variant="success">
                  <CircleCheckIcon />
                  {$t('analytics.graded')}
                </Badge>
              {:else if exercise.isCompleted}
                <Badge variant="secondary">{$t('audience.user_analytics.awaiting_grade')}</Badge>
              {:else}
                <Badge variant="outline">{$t('audience.user_analytics.not_submitted')}</Badge>
              {/if}
            </div>
          </ResourceListRow.End>
        </ResourceListRow.Root>
      {/each}
    </ResourceListRow.Group>
  {/if}
</Card.Root>
