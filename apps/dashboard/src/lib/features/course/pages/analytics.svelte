<script lang="ts">
  import ChartBarIcon from '@lucide/svelte/icons/chart-bar';
  import { AnalyticsPanelCard } from '$features/analytics';
  import type { CourseAnalytics } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { fade } from 'svelte/transition';
  import AnalyticsGraph from '$features/course/components/analytics/analytics-graph.svelte';
  import AnalyticsSkeleton from '$features/course/components/analytics/analytics-skeleton.svelte';
  import CourseAnalyticsKpis from '$features/course/components/analytics/course-analytics-kpis.svelte';
  import EmptyState from '$features/course/components/analytics/empty-state.svelte';
  import StudentTable from '$features/course/components/analytics/student-table.svelte';
  import { courseApi } from '../api/course.svelte';

  interface Props {
    courseAnalytics: CourseAnalytics | null;
  }

  let { courseAnalytics }: Props = $props();

  // Set the store in the API layer (similar to marks)
  $effect(() => {
    if (courseAnalytics) {
      courseApi.courseAnalytics = courseAnalytics;
    }
  });

  // Use the server data
  const isLoading = $derived(false);
</script>

{#if isLoading}
  <AnalyticsSkeleton />
{:else if courseAnalytics}
  <div class="space-y-6" in:fade>
    <CourseAnalyticsKpis data={courseAnalytics} />

    <AnalyticsGraph {courseAnalytics} />

    <AnalyticsPanelCard
      title={$t('analytics.student_progress_overview')}
      description={$t('analytics.course_metrics.students_table_description')}
    >
      {#snippet children()}
        <StudentTable students={courseAnalytics?.students ?? []} />
      {/snippet}
    </AnalyticsPanelCard>
  </div>
{:else}
  <EmptyState
    title={$t('analytics.no_analytics_data')}
    description={$t('analytics.no_analytics_description')}
    icon={ChartBarIcon}
    className="min-h-[480px]"
  />
{/if}
