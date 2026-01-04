<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Badge } from '@cio/ui/base/badge';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ChartLineIcon from '@lucide/svelte/icons/chart-line';
  import UnfoldVerticalIcon from '@lucide/svelte/icons/unfold-vertical';

  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { UserCourseAnalytics } from '$lib/utils/types/analytics';
  import { peopleApi } from '$features/course/api/people.svelte';

  import { Progress } from '@cio/ui/base/progress';
  import { ActivityCard, HeroProfileCard, LoadingPage } from '$features/ui';

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
    try {
      const analytics = await peopleApi.getUserCourseAnalytics(data.courseId, data.userId);
      userCourseAnalytics = analytics as UserCourseAnalytics | undefined;
    } catch (error) {
      console.error('Failed to fetch user course analytics:', error);
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
      percentage: userCourseAnalytics?.progressPercentage ?? 0,
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
      percentage: userCourseAnalytics?.averageGrade ?? 0,
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

    <div class="mt-5 px-0">
      <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each learningActivities as activity}
          <ActivityCard {activity} />
        {/each}
      </div>
    </div>

    <div class="mt-5 rounded-md border p-3 md:p-5">
      <h3 class="text-2xl">
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
          <Badge
            type={exerciseFilter === 'incomplete' ? 'secondary' : 'outline'}
            class="text-yellow-700 lowercase dark:text-yellow-500"
            onclick={() => toggleExerciseFilter('incomplete')}
          >
            {incompleteExercises}
            {$t('analytics.incomplete')}
          </Badge>
          <Badge
            type={exerciseFilter === 'completed' ? 'gray' : 'outline'}
            class="text-green-700 lowercase dark:text-green-500"
            onclick={() => toggleExerciseFilter('completed')}
          >
            {completedExercises}
            {$t('analytics.complete')}
          </Badge>
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
                    <Badge type={exercise.status === 3 ? 'secondary' : 'outline'}>
                      {exercise.status === 3 ? $t('analytics.graded') : $t('analytics.not_graded')}
                    </Badge>
                  {/if}
                </p>
              </div>
            </div>

            <Badge class={`${exercise.isCompleted ? 'bg-green-200 text-green-700' : 'bg-yellow-200 text-yellow-700'}`}>
              {exercise.isCompleted ? $t('analytics.completed') : $t('analytics.incomplete')}
            </Badge>
          </div>
        {/key}
      {/each}
    </div>
  </section>
{:else}
  <LoadingPage />
{/if}
