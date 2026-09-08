<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Table from '@cio/ui/base/table';
  import { Badge } from '@cio/ui/base/badge';
  import { STATUS } from '$features/course/components/exercise/constants';

  import { t } from '$lib/utils/functions/translations';
  import type { AudienceAnalyticsCourse, AudienceAnalyticsExercise } from '../utils/types';

  let {
    courses,
    studentId = ''
  }: {
    courses: AudienceAnalyticsCourse[];
    studentId?: string;
  } = $props();

  function gradeVariant(grade: number | null): 'outline' | 'success' | 'warning' | 'secondary' {
    if (grade === null) return 'outline';
    if (grade >= 70) return 'success';
    if (grade >= 50) return 'warning';

    return 'secondary';
  }

  function gradeLabel(grade: number | null, suffix = '%'): string {
    return grade === null ? '—' : `${grade}${suffix}`;
  }

  function scoreLabel(exercise: AudienceAnalyticsExercise): string {
    if (exercise.status !== STATUS.GRADED) return `—/${exercise.totalPoints}`;

    return `${exercise.score}/${exercise.totalPoints}`;
  }
</script>

<Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>{$t('audience.user_analytics.exercise')}</Table.Head>
        <Table.Head class="ui:w-28 ui:text-right">{$t('audience.user_analytics.score')}</Table.Head>
        <Table.Head class="ui:w-28">{$t('audience.user_analytics.status')}</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each courses as course (course.id)}
        <Table.Row class="ui:bg-muted/50">
          <Table.Cell class="font-semibold">{course.title}</Table.Cell>
          <Table.Cell class="ui:tabular-nums ui:text-right">
            {course.exercises_completed}/{course.exercises_count}
          </Table.Cell>
          <Table.Cell>
            <Badge variant={gradeVariant(course.average_grade)} class="ui:tabular-nums">
              {gradeLabel(course.average_grade, '% avg')}
            </Badge>
          </Table.Cell>
        </Table.Row>

        {#if course.exercises === null}
          <Table.Row>
            <Table.Cell class="ui:pl-6 ui:text-muted-foreground">
              {$t('audience.user_analytics.exercise_load_failed')}
            </Table.Cell>
            <Table.Cell />
            <Table.Cell />
          </Table.Row>
        {:else}
          {#each course.exercises ?? [] as exercise (exercise.id)}
            <Table.Row>
              <Table.Cell class="ui:pl-6">
                <a
                  href={`/courses/${course.id}/exercises/${exercise.id}?tab=submissions&submission=individual&student=${encodeURIComponent(studentId)}`}
                  class="text-sm hover:underline"
                >
                  {exercise.title}
                </a>
                <span class="ui:text-muted-foreground block text-xs">{exercise.lessonTitle}</span>
              </Table.Cell>
              <Table.Cell class="ui:tabular-nums ui:text-right">
                {scoreLabel(exercise)}
              </Table.Cell>
              <Table.Cell>
                {#if exercise.status === STATUS.GRADED}
                  <Badge variant="success">{$t('analytics.graded')}</Badge>
                {:else if exercise.isCompleted}
                  <Badge variant="secondary">{$t('audience.user_analytics.awaiting_grade')}</Badge>
                {:else}
                  <Badge variant="outline">{$t('audience.user_analytics.not_submitted')}</Badge>
                {/if}
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      {/each}
    </Table.Body>
  </Table.Root>
</Card.Root>
