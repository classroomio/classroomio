<script lang="ts">
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Progress from '$lib/components/Progress/index.svelte';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { Grid, Tag } from 'carbon-components-svelte';
  import Alarm from 'carbon-icons-svelte/lib/Alarm.svelte';
  import Email from 'carbon-icons-svelte/lib/Email.svelte';
  import Notebook from 'carbon-icons-svelte/lib/Notebook.svelte';
  import Report from 'carbon-icons-svelte/lib/Report.svelte';
  import RowExpand from 'carbon-icons-svelte/lib/RowExpand.svelte';
  import { fade } from 'svelte/transition';

  import '@carbon/charts-svelte/styles.css';

  export let data;

  const { user, userExercisesStats, averageGrade, progressPercentage } = data?.data;

  function getPercentage(a, b) {
    if (b === 0) {
      return 0;
    }
    return Math.round((a / b) * 100);
  }

  let exerciseFilter: 'all' | 'completed' | 'incomplete' = 'all';
  function toggleExerciseFilter(filter: 'completed' | 'incomplete') {
    if (exerciseFilter === filter) {
      exerciseFilter = 'all';
    } else {
      exerciseFilter = filter;
    }
  }

  $: learningActivities = [
    {
      description: 'Based on lesson completion',
      icon: Notebook,
      percentage: progressPercentage,
      title: 'Overall Progress'
    },
    {
      description: 'Percentage of completed assignments',
      icon: Report,
      percentage: getPercentage(
        userExercisesStats.filter((exercise) => exercise.isCompleted).length,
        userExercisesStats.length
      ),
      title: 'Assignment Completion'
    },
    {
      description: 'Average grade of all completed assignments',
      icon: RowExpand,
      percentage: averageGrade,
      title: 'Average Grade'
    }
  ];

  $: filteredExercises = userExercisesStats.filter((exercise) => {
    if (exerciseFilter === 'all') {
      return true;
    }
    return exercise.isCompleted === (exerciseFilter === 'completed');
  });
  $: completedExercises = userExercisesStats.filter((exercise) => exercise.isCompleted).length;
  $: incompleteExercises = userExercisesStats.filter((exercise) => !exercise.isCompleted).length;
</script>

<section class="px-1">
  <div class="rounded-md border p-5 dark:border-neutral-600">
    <div class="flex w-full flex-col items-center justify-start gap-4 text-start md:flex-row">
      <Avatar src={user.avatarUrl} name={user.fullName} width="w-16" height="h-16" />
      <div class="flex flex-col space-y-2">
        <p class="text-center text-2xl font-bold dark:text-white md:text-left">
          {user.fullName}
        </p>

        <div class="flex flex-col items-center gap-1 md:flex-row md:gap-4">
          <p class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300">
            <Email />
            {user.email}
          </p>

          <p class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300">
            <Alarm />
            Last seen:
            <span class="italic">
              {user.lastSeen ? calDateDiff(user.lastSeen) : 'a while ago'}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>

  <Grid class="mt-5 px-0" fullWidth>
    <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each learningActivities as activity}
        <div
          class="flex flex-col items-center justify-center gap-5 rounded-xl border p-3 dark:border-neutral-600 md:flex-row md:p-5"
        >
          <div class="bg-primary-200 w-fit rounded-full p-4 text-black">
            <svelte:component this={activity.icon} size={24} />
          </div>

          <div>
            <p
              class="text-center text-sm font-medium text-gray-600 dark:text-gray-200 md:text-left"
            >
              {activity.title}
            </p>
            <p class="text-center text-2xl font-bold md:text-left">{activity.percentage}%</p>
            <p class="text-center text-xs text-gray-500 dark:text-gray-300 md:text-left md:text-sm">
              {activity.description}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </Grid>

  <div class="mt-5 rounded-md border p-3 dark:border-neutral-600 md:p-5">
    <h3 class="text-2xl font-bold">Exercises</h3>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-200">Progress</p>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-200">
          {completedExercises} of {userExercisesStats.length} complete
        </p>
      </div>
      <Progress value={getPercentage(completedExercises, userExercisesStats.length)} />
      <div class="flex items-center justify-between">
        <PrimaryButton
          variant={exerciseFilter === 'incomplete' ? VARIANTS.OUTLINED : VARIANTS.TEXT}
          className="text-yellow-600 px-1"
          onClick={() => toggleExerciseFilter('incomplete')}
        >
          {incompleteExercises} incomplete
        </PrimaryButton>
        <PrimaryButton
          variant={exerciseFilter === 'completed' ? VARIANTS.OUTLINED : VARIANTS.TEXT}
          className="text-green-600 px-1"
          onClick={() => toggleExerciseFilter('completed')}
        >
          {completedExercises} complete
        </PrimaryButton>
      </div>
    </div>

    {#each filteredExercises as exercise, index}
      {#key index}
        <div
          class={`mt-5 flex items-center justify-between gap-4 rounded-md border p-5  ${
            exercise.isCompleted ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
          }`}
          transition:fade={{ duration: 300 }}
        >
          <div class="flex w-2/3 items-center gap-4">
            <Notebook size={24} class="text-black" />
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
                  <p class="text-sm font-semibold italic text-gray-500">
                    {exercise.lessonTitle}
                  </p>
                </a>
              </div>
              <p class="text-sm text-gray-500">
                Score: {exercise.score}/{exercise.totalPoints}

                {#if exercise.isCompleted}
                  <Tag type={exercise.status === 3 ? 'high-contrast' : 'outline'} size="sm">
                    {exercise.status === 3 ? 'Graded' : 'Not graded'}
                  </Tag>
                {/if}
              </p>
            </div>
          </div>

          <Tag
            class={`${
              exercise.isCompleted ? 'bg-green-200 text-green-700' : 'bg-yellow-200 text-yellow-700'
            }`}
          >
            {exercise.isCompleted ? 'Complete' : 'Incomplete'}
          </Tag>
        </div>
      {/key}
    {/each}
  </div>
</section>
