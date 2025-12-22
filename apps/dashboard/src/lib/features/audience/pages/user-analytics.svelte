<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Badge } from '@cio/ui/base/badge';
  import UnfoldVerticalIcon from '@lucide/svelte/icons/unfold-vertical';

  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ChartLineIcon from '@lucide/svelte/icons/chart-line';
  import { Progress } from '@cio/ui/base/progress';
  import { ActivityCard, HeroProfileCard, LoadingPage } from '$features/ui';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import { getAccessToken } from '$lib/utils/functions/supabase';
  import type { UserAnalytics } from '$lib/utils/types/analytics';

  let { data } = $props();

  let userAnalytics: UserAnalytics | undefined = $state();

  let courseFilter = $state('all');
  function toggleCourseFilter(filter: 'completed' | 'incomplete') {
    if (courseFilter === filter) {
      courseFilter = 'all';
    } else {
      courseFilter = filter;
    }
  }

  async function fetchUserAnalytics() {
    const accessToken = await getAccessToken();
    const response = await fetch('/api/analytics/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error(response);
      snackbar.error('Failed to fetch analytics data');
    }

    userAnalytics = (await response.json()) as UserAnalytics;
  }

  onMount(() => {
    fetchUserAnalytics();
  });

  let userMetrics = $derived([
    {
      icon: BookOpenIcon,
      title: $t('analytics.enrolled_courses'),
      description: $t('analytics.enrolled_courses_description'),
      percentage: userAnalytics?.courses?.length || 0,
      hidePercentage: true
    },
    {
      icon: ChartLineIcon,
      title: $t('analytics.overall_course_progress'),
      description: $t('analytics.overall_course_progress_description'),
      percentage: userAnalytics?.overallCourseProgress || 0
    },
    {
      icon: UnfoldVerticalIcon,
      title: $t('analytics.total_average_grade'),
      description: $t('analytics.total_average_grade_description'),
      percentage: userAnalytics?.overallAverageGrade || 0
    }
  ]);

  let completedCourses = $derived(
    userAnalytics?.courses?.filter((course) => course.lessons_count === course.lessons_completed)?.length
  );
  let incompleteCourses = $derived(
    userAnalytics?.courses?.filter((course) => course.lessons_count !== course.lessons_completed)?.length
  );

  let filteredCourses = $derived(
    userAnalytics?.courses?.filter((course) => {
      if (courseFilter === 'all') {
        return true;
      }
      return (course.lessons_count === course.lessons_completed) === (courseFilter === 'completed');
    })
  );
</script>

{#if userAnalytics}
  <div class="p-5">
    <a class="text-md flex items-center text-gray-500 dark:text-white" href={`${$currentOrgPath}/audience`}>
      <ArrowLeftIcon size={16} />
      {$t('community.ask.go_back')}
    </a>
  </div>

  <div class="px-5 py-1">
    <HeroProfileCard user={userAnalytics!.user} />

    <div class="mt-5 px-0">
      <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each userMetrics as activity}
          <ActivityCard {activity} />
        {/each}
      </div>
    </div>

    <div class="mt-5 rounded-md border p-3 md:p-5 dark:border-neutral-600">
      <h3 class="text-2xl">
        {$t('analytics.courses')}
      </h3>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-200">
            {$t('analytics.progress')}
          </p>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-200">
            {$t('analytics.progress_description', {
              value: completedCourses,
              total: userAnalytics!.courses.length
            })}
          </p>
        </div>
        <Progress value={userAnalytics!.overallCourseProgress} />
        <div class="flex items-center justify-between">
          <Badge
            type={courseFilter === 'incomplete' ? 'secondary' : 'outline'}
            class="text-yellow-700 dark:text-yellow-500"
            onclick={() => toggleCourseFilter('incomplete')}
          >
            {incompleteCourses}
            {$t('analytics.incomplete')}
          </Badge>
          <Badge
            type={courseFilter === 'completed' ? 'secondary' : 'outline'}
            class="text-green-700 dark:text-green-500"
            onclick={() => toggleCourseFilter('completed')}
          >
            {completedCourses}
            {$t('analytics.complete')}
          </Badge>
        </div>
      </div>

      {#each filteredCourses as course, index}
        {#key index}
          <div
            class={`mt-5 w-full rounded-md border border-gray-200 p-5 ${
              course.lessons_count === course.lessons_completed
                ? 'border-green-200 bg-green-50 dark:bg-green-100'
                : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-100'
            }`}
            transition:fade={{ duration: 300 }}
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex w-4/5 items-center gap-4">
                <img
                  src={course.logo || '/images/classroomio-course-img-template.jpg'}
                  alt={course.title}
                  class="h-20 w-24 rounded-md"
                />
                <div class="mb-4 gap-4">
                  <a href={`/courses/${course.id}`}>
                    <p class="text-lg font-semibold text-gray-600">
                      {course.title}
                    </p>
                  </a>

                  <p class="line-clamp-2 text-sm text-gray-600">
                    {course.description}
                  </p>
                </div>
              </div>

              <Badge
                class={`${
                  course.lessons_count === course.lessons_completed
                    ? 'bg-green-200 text-green-700'
                    : 'bg-yellow-200 text-yellow-700'
                }`}
              >
                {course.lessons_count === course.lessons_completed
                  ? $t('analytics.completed')
                  : $t('analytics.incomplete')}
              </Badge>
            </div>

            <div class="flex w-full items-center gap-1">
              <Progress value={course.progress_percentage} />
              <p>{course.progress_percentage}%</p>
            </div>
          </div>
        {/key}
      {/each}
    </div>
  </div>
{:else}
  <LoadingPage />
{/if}
