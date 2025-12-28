<script lang="ts">
  import { Empty } from '@cio/ui/custom/empty';
  import UserXIcon from '@lucide/svelte/icons/user-x';
  import { course } from '$features/course/store';
  import { t } from '$lib/utils/functions/translations';
  import { fetchMarks } from '$lib/utils/services/marks';
  import { snackbar } from '$features/ui/snackbar/store';
  import { getLectureNo } from '$features/course/utils/functions';
  import { fetchExercisesByMarks } from '$lib/utils/services/courses';
  import { lessons } from '$features/course/components/lesson/store/lessons';
  import type { GroupPerson } from '$lib/utils/types';

  let borderBottomGrey = 'border-r-0 border-t-0 border-b border-l-0 border-gray-300';
  let borderleftGrey = 'border-r-0 border-t-0 border-b-0 border-l border-gray-300';
  let students: GroupPerson[] = $state([]);
  let lessonMapping: Record<string, Record<string, { title: string; points: number }>> = $state({}); // { lessonId: { exerciseId: exerciseTitle, ... }, ... }
  let studentMarksByExerciseId: Record<string, Record<string, string>> = $state({}); // { groupMemberId: { exerciseId: `total_gotten/points`, ... }, ... }
  let hasFetched = $state(false);

  function calculateStudentTotal(studentExerciseData) {
    if (!studentExerciseData) return 0;

    return Object.values(studentExerciseData).reduce((total: number, point) => (total += parseInt(point as string)), 0);
  }

  async function firstRender(courseId?: string) {
    if (!courseId || hasFetched) return;

    hasFetched = true;

    const { data: marks, error } = await fetchMarks(courseId);
    if (error) {
      console.error('Error fetching marks', error);
      snackbar.error('snackbar.marks.error');
      return;
    }

    if (!marks || !Array.isArray(marks)) return;

    marks.forEach((mark) => {
      const { groupmember_id, exercise_id, total_points_gotten } = mark;

      if (studentMarksByExerciseId[groupmember_id]) {
        studentMarksByExerciseId[groupmember_id] = {
          ...studentMarksByExerciseId[groupmember_id],
          [exercise_id]: total_points_gotten
        };
      } else {
        studentMarksByExerciseId[groupmember_id] = {
          [exercise_id]: total_points_gotten
        };
      }
    });

    const { data: exercises } = await fetchExercisesByMarks(courseId);

    // Map exercises to { lessonId: { exerciseId: exerciseTitle, ... }, ... }
    exercises.forEach((exercise) => {
      const { lesson_id, exercise_id, exercise_title, points } = exercise;

      if (lessonMapping[lesson_id]) {
        lessonMapping[lesson_id] = {
          ...lessonMapping[lesson_id],
          [exercise_id]: { title: exercise_title, points }
        };
      } else {
        lessonMapping[lesson_id] = {
          [exercise_id]: { title: exercise_title, points }
        };
      }
    });
  }

  $effect(() => {
    firstRender($course.id);
  });
</script>

<div id="tableContainer" class="table w-full rounded-md border border-gray-300">
  <div class="flex items-center {borderBottomGrey}">
    <div class="box flex items-center p-3">
      <p class="w-40 dark:text-white">{$t('course.navItem.marks.student')}</p>
    </div>
    {#each $lessons as lesson, index}
      {#if lessonMapping[lesson.id]}
        <div class="box flex flex-col items-center {borderleftGrey}">
          <p class="col lesson-number dark:text-white" title={lesson.title}>
            {getLectureNo(index + 1)}
          </p>
          <div class="flex h-full items-center border-t border-r-0 border-b-0 border-l-0 border-gray-300">
            {#each Object.keys(lessonMapping[lesson.id]) as exerciseId, index}
              <p
                class="col text-sm dark:text-white {index && borderleftGrey}"
                title={lessonMapping[lesson.id][exerciseId].title}
              >
                {lessonMapping[lesson.id][exerciseId].title}
                <span>({lessonMapping[lesson.id][exerciseId].points})</span>
              </p>
            {/each}
          </div>
        </div>
      {/if}
    {/each}
    <div class="box flex items-center {borderleftGrey}">
      <p class="w-20 text-center dark:text-white">{$t('course.navItem.marks.total')}</p>
    </div>
  </div>

  {#each students as student}
    <div class="relative flex cursor-pointer items-center p-3 {borderBottomGrey}">
      <div class="flex w-40 items-center">
        <img alt="Student avatar" src={student.profile.avatar_url} class="mr-2 h-8 w-8 rounded-full" />
        <div class="text-sm">
          <p class="font-semibold dark:text-white">
            {student.profile.fullname}
          </p>
          <p class="dark:text-white">
            {`${student.assigned_student_id ? '#' + student.assigned_student_id : '-'}`}
          </p>
        </div>
      </div>
      {#each $lessons as lesson}
        {#if lessonMapping[lesson.id]}
          <div class="flex items-center">
            {#each Object.keys(lessonMapping[lesson.id]) as exerciseId}
              <p class="col dark:text-white">
                {studentMarksByExerciseId[student.id] ? studentMarksByExerciseId[student.id][exerciseId] || '-' : '-'}
              </p>
            {/each}
          </div>
        {/if}
      {/each}

      <div class="flex w-20 items-center">
        <div class="text-sm">
          <p class="col dark:text-white">
            {calculateStudentTotal(studentMarksByExerciseId[student.id])}
          </p>
        </div>
      </div>
    </div>
  {:else}
    <Empty title={$t('course.navItem.marks.no_student')} icon={UserXIcon} variant="page" />
  {/each}
</div>

<style>
  .col {
    text-align: center;
    padding: 5px;
    width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .br {
    border-right: 1px solid rgba(209, 213, 219, var(--tw-border-opacity));
  }

  .box {
    height: 95px;
  }

  .lesson-number {
    height: 30px;
  }
</style>
