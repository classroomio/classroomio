<script lang="ts">
  import { cloneDeep } from 'lodash';
  import Chip from '$lib/components/Chip/index.svelte';
  import { profile } from '$lib/utils/store/user';
  import { browser } from '$app/environment';
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
  let sections: Section[] = cloneDeep(defaultSections);
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

      const grade = `${submissionItem.total}/${questions.reduce(
        (acc, cur) => (acc += cur.points),
        0
      )}`;

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

  async function fetchData(profileId: string, orgId: string) {
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

  $: if (browser && $profile.id && $currentOrg.id) {
    fetchData($profile.id, $currentOrg.id);
  }
</script>

<section class="w-full max-w-6xl mx-auto">
  <div class="p-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">{$t('exercises.heading')}</h1>
    </div>

    <div>
      <div class="flex items-center w-full">
        {#each sections as { title, items, className, id }}
          <div
            class="min-w-[355px] max-w-[355px] h-[70vh] rounded-md bg-gray-100 dark:bg-black border border-gray-50 dark:border-neutral-700 p-3 mr-3 overflow-hidden"
          >
            <div class="flex items-center mb-2 gap-2">
              <p class="dark:text-white ml-2 font-bold">{title}</p>
              <Chip value={items.length} {className} />
            </div>
            <div class="pr-2 h-full overflow-y-auto pb-3">
              {#each items as item}
                <div class=" w-full my-2 mx-0 rounded-md bg-white dark:bg-neutral-800 py-3 px-3">
                  <a
                    class="flex w-full items-center cursor-pointer text-primary-600 mb-2"
                    href={item.courseURL}
                  >
                    <p class="text-xs">{item.courseTitle}</p>
                  </a>
                  <a class="text-black dark:text-white text-md font-bold" href={item.exerciseURL}>
                    {#if id === 3}
                      ({item.grade}) -
                    {/if}
                    {item.exerciseTitle}
                  </a>
                  <a
                    class="flex items-center no-underline hover:underline text-black my-2 w-fit"
                    href={item.lessonURL}
                  >
                    <p class="dark:text-white text-grey text-sm">
                      {$t('exercises.lesson')} <span class="italic">{item.lessonTitle}</span>
                    </p>
                  </a>
                  <p class="dark:text-white text-gray-500 text-xs">
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
