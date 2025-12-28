<script lang="ts">
  import { onMount } from 'svelte';
  import ChartBarIcon from '@lucide/svelte/icons/chart-bar';
  import { t } from '$lib/utils/functions/translations';
  import { getAccessToken } from '$lib/utils/functions/supabase';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { CourseAnalytics } from '$lib/utils/types/analytics';
  import { fade } from 'svelte/transition';
  import StudentTable from '$features/course/components/analytics/student-table.svelte';
  import AnalyticsGraph from '$features/course/components/analytics/analytics-graph.svelte';
  import AnalyticsSkeleton from '$features/course/components/analytics/analytics-skeleton.svelte';
  import AnalyticsCard from '$features/course/components/analytics/analytics-card.svelte';
  import StudentsIcon from '$features/course/components/analytics/icons/students-icon.svelte';
  import LessonsIcon from '$features/course/components/analytics/icons/lessons-icon.svelte';
  import ProgressIcon from '$features/course/components/analytics/icons/progress-icon.svelte';
  import ExercisesIcon from '$features/course/components/analytics/icons/exercises-icon.svelte';
  import EmptyState from '$features/course/components/analytics/empty-state.svelte';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  let courseAnalytics: CourseAnalytics | null = $state(null);
  let isLoading = $state(true);

  async function fetchCourseAnalytics() {
    try {
      isLoading = true;

      const accessToken = await getAccessToken();
      const response = await fetch(`/api/courses/analytics?courseId=${courseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken
        }
      });

      if (response.ok) {
        const { data } = await response.json();

        courseAnalytics = data as CourseAnalytics;
      } else {
        console.error('Failed to fetch course analytics:', response);
        snackbar.error('Failed to load analytics data');
        courseAnalytics = null;
      }
    } catch (error) {
      console.error('Failed to fetch course analytics:', error);
      snackbar.error('Failed to load analytics data');
      courseAnalytics = null;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchCourseAnalytics();
  });
</script>

{#if isLoading}
  <AnalyticsSkeleton />
{:else if courseAnalytics}
  <div class="min-h-screen" in:fade>
    <!-- Main Content Area -->
    <div class="px-4 py-8">
      <!-- Course Overview Cards -->
      <div class="mb-12">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- Students Card -->
          <AnalyticsCard
            title={$t('analytics.students')}
            value={courseAnalytics?.totalStudents || 0}
            subtitle="{$t('analytics.tutors')}: {courseAnalytics?.totalTutors || 0}"
            icon={StudentsIcon}
            iconColor="blue"
          />

          <!-- Lessons Card -->
          <AnalyticsCard
            title={$t('analytics.lessons')}
            value={courseAnalytics?.totalLessons || 0}
            subtitle="{$t('analytics.exercises')}: {courseAnalytics?.totalExercises || 0}"
            icon={LessonsIcon}
            iconColor="green"
          />

          <!-- Progress Card -->
          <AnalyticsCard
            title={$t('analytics.progress')}
            value="{courseAnalytics?.lessonCompletionRate || 0}%"
            subtitle="{$t('analytics.avg_grade')}: {courseAnalytics?.averageGrade || 0}%"
            icon={ProgressIcon}
            iconColor="purple"
          />

          <!-- Exercise Completion Card -->
          <AnalyticsCard
            title={$t('analytics.exercises')}
            value="{courseAnalytics?.exerciseCompletionRate || 0}%"
            subtitle={$t('analytics.completion_rate')}
            icon={ExercisesIcon}
            iconColor="orange"
          />
        </div>
      </div>

      <!-- Charts Section -->
      <div class="mb-12">
        <AnalyticsGraph {courseAnalytics} />
      </div>

      <!-- Students Overview Table -->
      <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-neutral-800">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {$t('analytics.student_progress_overview')}
          </h3>
        </div>
        <div class="p-6">
          <StudentTable students={courseAnalytics?.students || []} />
        </div>
      </div>
    </div>
  </div>
{:else}
  <EmptyState
    title={$t('analytics.no_analytics_data')}
    description={$t('analytics.no_analytics_description')}
    icon={ChartBarIcon}
    className="h-screen"
  />
{/if}
