<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import { Chip } from '@cio/ui/custom/chip';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { fetchLMSExercises } from '$lib/utils/services/lms/exercises';
  import type { LMSExercise } from '$lib/utils/services/lms/exercises';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';

  const defaultSections = [
    {
      id: 0,
      title: $t('exercises.not_submitted'),
      items: [],
      className: 'text-[#E35353] bg-[#FDDFE4]'
    },
    {
      id: 1,
      title: $t('exercises.submitted'),
      items: [],
      className: 'text-orange-700 bg-orange-200'
    },
    {
      id: 2,
      title: $t('exercises.in_progress'),
      items: [],
      className: 'text-yellow-700 bg-yellow-200'
    },
    {
      id: 3,
      title: $t('exercises.graded'),
      value: 0,
      items: [],
      className: 'text-green-700 bg-green-200'
    }
  ];
  let sections: Section[] = $state(cloneDeep(defaultSections));
  let hasFetched = $state(false);

  interface Section {
    id: number;
    title: string;
    className: string;
    items: ExerciseItem[];
  }

  interface ExerciseItem {
    courseTitle: string;
    courseURL: string;
    exerciseId: string;
    exerciseTitle: string;
    exerciseURL: string;
    grade: string;
    lessonNo: string;
    lessonTitle: string;
    lessonURL: string;
    submissionStatus: number;
    submissionUpdatedAt: string;
  }

  function generateSections(exercises: LMSExercise[]): Section[] {
    const _sections: Section[] = cloneDeep(defaultSections);

    for (const exercise of exercises) {
      const { id, title, updated_at, submission, lesson, questions } = exercise;

      const submissionItem = submission[0] || {
        status_id: 0,
        updated_at,
        total: 0
      };

      const courseURL = `/courses/${lesson.course.id}`;
      const lessonURL = `${courseURL}/lessons/${lesson.id}`;
      const exerciseURL = `${lessonURL}/exercises/${id}`;

      const grade = `${submissionItem.total}/${questions.reduce((acc, cur) => (acc += cur.points), 0)}`;

      const item: ExerciseItem = {
        exerciseId: id,
        courseTitle: lesson.course.title,
        courseURL,
        exerciseTitle: title,
        exerciseURL,
        lessonTitle: lesson.title,
        lessonNo: lesson.order < 9 ? '0' + (lesson.order + 1) : `${lesson.order}`,
        lessonURL,
        submissionStatus: submissionItem.status_id,
        submissionUpdatedAt: calDateDiff(submissionItem.updated_at),
        grade
      };

      _sections[submissionItem.status_id].items.push(item);
    }

    return _sections;
  }

  async function fetchData(profileId?: string, orgId?: string) {
    if (hasFetched || !profileId || !orgId) {
      return;
    }

    hasFetched = true;

    // Don't rerun this function if any state is updated in this function.
    const { exercises, error } = await fetchLMSExercises(profileId, orgId);
    console.log('exercises', exercises);
    console.log('error', error);

    if (error) {
      snackbar.error('snackbar.exercise.error_fetching');
      return;
    }

    if (!exercises) return;

    sections = generateSections(exercises);
    console.log('sections', sections);
  }

  $effect(() => {
    fetchData($profile.id, $currentOrg.id);
  });
</script>

<section class="mx-auto w-full max-w-6xl">
  <div class="p-5">
    <div class="mb-10 flex items-center justify-between">
      <h1 class="text-3xl dark:text-white">{$t('exercises.heading')}</h1>
    </div>

    <div>
      <div class="flex w-full items-center">
        {#each sections as { title, items, className, id }}
          <div
            class="mr-3 h-[70vh] min-w-[355px] max-w-[355px] overflow-hidden rounded-md border border-gray-50 bg-gray-100 p-3 dark:border-neutral-700 dark:bg-black"
          >
            <div class="mb-2 flex items-center gap-2">
              <p class="ml-2 dark:text-white">{title}</p>
              <Chip value={items.length} {className} />
            </div>
            <div class="h-full overflow-y-auto pb-3 pr-2">
              {#each items as item}
                <div class=" mx-0 my-2 w-full rounded-md bg-white px-3 py-3 dark:bg-neutral-800">
                  <a class="text-primary-600 mb-2 flex w-full cursor-pointer items-center" href={item.courseURL}>
                    <p class="text-xs">{item.courseTitle}</p>
                  </a>
                  <a class="text-md text-black dark:text-white" href={item.exerciseURL}>
                    {#if id === 3}
                      ({item.grade}) -
                    {/if}
                    {item.exerciseTitle}
                  </a>
                  <a class="my-2 flex w-fit items-center text-black no-underline hover:underline" href={item.lessonURL}>
                    <p class="text-grey text-sm dark:text-white">
                      {$t('exercises.lesson')} <span class="italic">{item.lessonTitle}</span>
                    </p>
                  </a>
                  <p class="text-xs text-gray-500 dark:text-white">
                    {item.submissionUpdatedAt}
                  </p>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
