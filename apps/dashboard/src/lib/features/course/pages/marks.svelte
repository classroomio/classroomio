<script lang="ts">
  import { Empty } from '@cio/ui/custom/empty';
  import UserXIcon from '@lucide/svelte/icons/user-x';
  import { t } from '$lib/utils/functions/translations';
  import { getLectureNo } from '$features/course/utils/functions';
  import { lessonApi } from '$features/course/api';
  import { calculateStudentTotal } from '$features/course/utils/marks-utils';
  import type { MarksPageData } from '$features/course/utils/marks-utils';

  interface Props {
    marksData: MarksPageData | null;
  }

  let { marksData }: Props = $props();

  let borderBottomGrey = 'border-r-0 border-t-0 border-b border-l-0 border-gray-300';
  let borderleftGrey = 'border-r-0 border-t-0 border-b-0 border-l border-gray-300';

  // Initialize from props (server data)
  const students = $derived(marksData?.students || []);
  const lessonMapping = $derived(marksData?.lessonMapping || {});
  const studentMarksByExerciseId = $derived(marksData?.studentMarksByExerciseId || {});
</script>

<div id="tableContainer" class="table w-full rounded-md border border-gray-300">
  <div class="flex items-center {borderBottomGrey}">
    <div class="box flex items-center p-3">
      <p class="w-40 dark:text-white">{$t('course.navItem.marks.student')}</p>
    </div>
    {#each lessonApi.lessons as lesson, index}
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
        <img alt="Student avatar" src={student.profile?.avatarUrl} class="mr-2 h-8 w-8 rounded-full" />
        <div class="text-sm">
          <p class="font-semibold dark:text-white">
            {student.profile?.fullname}
          </p>
          <p class="dark:text-white">
            {`${student.assignedStudentId ? '#' + student.assignedStudentId : '-'}`}
          </p>
        </div>
      </div>
      {#each lessonApi.lessons as lesson}
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
