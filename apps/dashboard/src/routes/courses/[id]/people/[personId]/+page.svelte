<script lang="ts">
  import { ActivityCard, HeroProfileCard, LoadingPage } from '$lib/components/Analytics';
  import Progress from '$lib/components/Progress/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { getAccessToken } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import type { UserCourseAnalytics } from '$lib/utils/types/analytics';
  import { Grid, Tag } from 'carbon-components-svelte';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ChartLineIcon from '@lucide/svelte/icons/chart-line';
  import UnfoldVerticalIcon from '@lucide/svelte/icons/unfold-vertical';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let { data } = $props();

  let userCourseAnalytics: UserCourseAnalytics | undefined = $state();

  function getPercentage(a: number, b: number): number {
    if (b === 0) {
      return 0;
    }
    return Math.round((a / b) * 100);
  }

  let exerciseFilter: 'all' | 'completed' | 'incomplete' = $state('all');
  function toggleExerciseFilter(filter: 'completed' | 'incomplete') {
    if (exerciseFilter === filter) {
      exerciseFilter = 'all';
    } else {
      exerciseFilter = filter;
    }
  }

  async function fetchUserCourseAnalytics() {
    const accessToken = await getAccessToken();
    const response = await fetch('/api/analytics/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      userCourseAnalytics = (await response.json()) as UserCourseAnalytics;
    } else {
      console.error(response);
      snackbar.error('Failed to fetch analytics data');
    }
  }

  onMount(() => {
    fetchUserCourseAnalytics();
  });

  let learningActivities = $derived([
    {
      description: $t('analytics.overall_course_progress_user_description'),
      icon: BookOpenIcon,
      percentage: userCourseAnalytics?.progressPercentage,
      title: $t('analytics.overall_course_progress')
    },
    {
      description: $t('analytics.assignment_completion_description'),
      icon: ChartLineIcon,
      percentage: getPercentage(
        userCourseAnalytics?.userExercisesStats?.filter((exercise) => exercise.isCompleted)?.length || 0,
        userCourseAnalytics?.userExercisesStats?.length || 0
      ),
      title: $t('analytics.assignment_completion')
    },
    {
      description: $t('analytics.average_grade_description'),
      icon: UnfoldVerticalIcon,
      percentage: userCourseAnalytics?.averageGrade,
      title: $t('analytics.average_grade')
    }
  ]);

  let filteredExercises = $derived(
    userCourseAnalytics?.userExercisesStats?.filter((exercise) => {
      if (exerciseFilter === 'all') {
        return true;
      }
      return exercise.isCompleted === (exerciseFilter === 'completed');
    })
  );
  let completedExercises = $derived(
    userCourseAnalytics?.userExercisesStats?.filter((exercise) => exercise.isCompleted)?.length || 0
  );
  let incompleteExercises = $derived(
    userCourseAnalytics?.userExercisesStats?.filter((exercise) => !exercise.isCompleted)?.length || 0
  );
</script>

{#if userCourseAnalytics}
  <section class="px-1">
    <HeroProfileCard user={userCourseAnalytics.user} />

    <Grid class="mt-5 px-0" fullWidth>
      <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each learningActivities as activity}
          <ActivityCard {activity} />
        {/each}
      </div>
    </Grid>

    <div class="mt-5 rounded-md border p-3 md:p-5 dark:border-neutral-600">
      <h3 class="text-2xl font-bold">
        {$t('analytics.exercises')}
      </h3>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-200">
            {$t('analytics.exercises')}
          </p>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-200">
            {$t('analytics.progress_description', {
              value: completedExercises,
              total: userCourseAnalytics?.userExercisesStats?.length
            })}
          </p>
        </div>
        <Progress value={getPercentage(completedExercises, userCourseAnalytics?.userExercisesStats?.length)} />
        <div class="flex items-center justify-between">
          <Tag
            interactive
            filter={exerciseFilter === 'incomplete'}
            type={exerciseFilter === 'incomplete' ? 'gray' : 'outline-solid'}
            class="lowercase text-yellow-700 dark:text-yellow-500"
            on:click={() => toggleExerciseFilter('incomplete')}
          >
            {incompleteExercises}
            {$t('analytics.incomplete')}
          </Tag>
          <Tag
            interactive
            filter={exerciseFilter === 'completed'}
            type={exerciseFilter === 'completed' ? 'gray' : 'outline-solid'}
            class="lowercase text-green-700 dark:text-green-500"
            on:click={() => toggleExerciseFilter('completed')}
          >
            {completedExercises}
            {$t('analytics.complete')}
          </Tag>
        </div>
      </div>

      {#each filteredExercises as exercise, index}
        {#key index}
          <div
            class={`mt-5 flex items-center justify-between gap-4 rounded-md border p-5  ${
              exercise.isCompleted
                ? 'border-green-200 bg-green-50 dark:bg-green-100'
                : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-100'
            }`}
            transition:fade={{ duration: 300 }}
          >
            <div class="flex w-2/3 items-center gap-4">
              <BookOpenIcon size={16} />
              <div>
                <div class="mb-2">
                  <a
                    href={`/courses/${data.courseId}/lessons/${exercise.lessonId}/exercises/${exercise.id}?tabIndex=1`}
                  >
                    <p class="text-lg font-semibold text-gray-600">
                      {exercise.title}
                    </p>
                  </a>

                  <a href={`/courses/${data.courseId}/lessons/${exercise.lessonId}`}>
                    <p class="text-sm text-gray-500">
                      #{exercise.lessonTitle}
                    </p>
                  </a>
                </div>
                <p class="text-sm text-gray-500">
                  Score: {exercise.score}/{exercise.totalPoints}

                  {#if exercise.isCompleted}
                    <Tag type={exercise.status === 3 ? 'high-contrast' : 'outline-solid'} size="sm">
                      {exercise.status === 3 ? $t('analytics.graded') : $t('analytics.not_graded')}
                    </Tag>
                  {/if}
                </p>
              </div>
            </div>

            <Tag class={`${exercise.isCompleted ? 'bg-green-200 text-green-700' : 'bg-yellow-200 text-yellow-700'}`}>
              {exercise.isCompleted ? $t('analytics.completed') : $t('analytics.incomplete')}
            </Tag>
          </div>
        {/key}
      {/each}
    </div>
  </section>
{:else}
  <LoadingPage />
{/if}
