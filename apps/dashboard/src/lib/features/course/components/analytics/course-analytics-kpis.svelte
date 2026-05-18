<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import PercentIcon from '@lucide/svelte/icons/percent';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { KpiCard } from '$features/analytics';
  import type { CourseAnalytics } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    data: CourseAnalytics;
  }

  let { data }: Props = $props();

  const tutorsCount = $derived(data.totalTutors ?? 0);
  const exerciseTotal = $derived(data.totalExercises ?? 0);
  const avgGrade = $derived(data.averageGrade ?? 0);
  const lessonRate = $derived(data.lessonCompletionRate ?? 0);
  const exerciseRate = $derived(data.exerciseCompletionRate ?? 0);
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <KpiCard
    title={$t('analytics.students')}
    value={(data.totalStudents ?? 0).toLocaleString()}
    description={$t('analytics.course_metrics.kpi_team_tutors', { count: tutorsCount })}
    icon={UsersIcon}
    accent="primary"
  />
  <KpiCard
    title={$t('analytics.lessons')}
    value={(data.totalLessons ?? 0).toLocaleString()}
    description={$t('analytics.course_metrics.kpi_lessons_exercises', { count: exerciseTotal })}
    icon={BookOpenIcon}
    accent="warning"
  />
  <KpiCard
    title={$t('analytics.progress')}
    value={`${lessonRate}%`}
    description={$t('analytics.course_metrics.kpi_progress_grade', { grade: avgGrade })}
    icon={PercentIcon}
    accent="success"
  />
  <KpiCard
    title={$t('analytics.exercises')}
    value={`${exerciseRate}%`}
    description={$t('analytics.completion_rate')}
    icon={ListChecksIcon}
    accent="primary"
  />
</div>
