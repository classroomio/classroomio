<script lang="ts">
  import { goto } from '$app/navigation';
  import AudioConsoleIcon from 'carbon-icons-svelte/lib/AudioConsole.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { ROLE } from '$lib/utils/constants/roles';
  import { group } from '$lib/components/Course/store';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';
  import { fetchCourse, fetchExercisesByMarks } from '$lib/utils/services/courses';
  import { getLectureNo } from '$lib/components/Course/function.js';
  import { fetchMarks } from '$lib/utils/services/marks';
  import { profile } from '$lib/utils/store/user';
  import { browser } from '$app/environment';
  import { course } from '$lib/components/Course/store';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import type { GroupPerson } from '$lib/utils/types';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Papa from 'papaparse';

  export let data;

  let borderBottomGrey = 'border-r-0 border-t-0 border-b border-l-0 border-gray-300';
  let borderleftGrey = 'border-r-0 border-t-0 border-b-0 border-l border-gray-300';
  let students: GroupPerson[] = [];
  let isExporting = false;

  let lessonMapping = {}; // { lessonId: { exerciseId: exerciseTitle, ... }, ... }
  let studentMarksByExerciseId = {}; // { groupMemberId: { exerciseId: `total_gotten/points`, ... }, ... }

  function calculateStudentTotal(studentExerciseData) {
    if (!studentExerciseData) return 0;

    return Object.values(studentExerciseData).reduce(
      (total: number, point) => (total += parseInt(point as string)),
      0
    );
  }

  async function firstRender(courseId: string) {
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
  // TODO WRITE A REDIRECT FUNCTION FOR THIS THIS PAGE

  function getPageRoles(org: CurrentOrg) {
    const roles = [1, 2];

    if (org.customization.course.grading) {
      roles.push(3);
    }

    return roles;
  }

  const exportMarks = () => {
    isExporting = true;
    try {
      let exportData = students.map((student) => {
        let rowData = { name: student.profile.fullname };
        let totalPoints = calculateStudentTotal(studentMarksByExerciseId[student.id]);

        $lessons.forEach((lesson, lessonIndex) => {
          const quizzes = lessonMapping[lesson.id];
          const quizMark = studentMarksByExerciseId[student.id];

          Object.keys(quizzes).forEach((quizId, quizIndex) => {
            const quiz = quizzes[quizId];
            const title = quiz.title;
            rowData[`lesson_${lessonIndex + 1}_quiz_${quizIndex + 1}: ${title}`] =
              quizMark[quizId] || '-';
          });
        });

        rowData.total = totalPoints;
        return rowData;
      });

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${$course?.title}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.log(error);
    } finally {
      isExporting = false;
    }
  };

  $: students = $globalStore.isStudent
    ? $group.people.filter((person) => !!person.profile && person.profile.id === $profile.id)
    : $group.people.filter((person) => !!person.profile && person.role_id === ROLE.STUDENT);

  $: browser && $course.id && firstRender($course.id);
</script>

<CourseContainer bind:courseId={data.courseId}>
  <RoleBasedSecurity
    allowedRoles={getPageRoles($currentOrg)}
    onDenied={() => {
      goto(`/courses/${data.courseId}/lessons?next=true`);
    }}
  >
    <PageNav title={$t('course.navItem.marks.title')}>
      <slot:fragment slot="widget">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <PrimaryButton
            className="mr-2"
            label="Export"
            onClick={exportMarks}
            isDisabled={isExporting}
            isLoading={isExporting}
          />
        </RoleBasedSecurity>
      </slot:fragment>
    </PageNav>

    <PageBody width="w-full max-w-6xl md:w-11/12">
      <div class="table rounded-md border border-gray-300 w-full">
        <div class="flex items-center {borderBottomGrey}">
          <div class="box flex items-center p-3">
            <p class="dark:text-white w-40">{$t('course.navItem.marks.student')}</p>
          </div>
          {#each $lessons as lesson, index}
            {#if lessonMapping[lesson.id]}
              <div class="box flex flex-col items-center {borderleftGrey}">
                <p class="dark:text-white col lesson-number" title={lesson.title}>
                  {getLectureNo(index + 1)}
                </p>
                <div
                  class="flex h-full items-center border-r-0 border-t border-b-0 border-l-0 border-gray-300"
                >
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
            <p class="dark:text-white w-20 text-center">{$t('course.navItem.marks.total')}</p>
          </div>
        </div>

        {#each students as student}
          <div class="flex relative items-center p-3 cursor-pointer {borderBottomGrey}">
            <div class="w-40 flex items-center">
              <img
                alt="Student avatar"
                src={student.profile.avatar_url}
                class="w-8 h-8 rounded-full mr-2"
              />
              <div class="text-sm">
                <p class="dark:text-white font-semibold">
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
                    <p class="dark:text-white col">
                      {studentMarksByExerciseId[student.id]
                        ? studentMarksByExerciseId[student.id][exerciseId] || '-'
                        : '-'}
                    </p>
                  {/each}
                </div>
              {/if}
            {/each}

            <div class="w-20 flex items-center">
              <div class="text-sm">
                <p class="dark:text-white col">
                  {calculateStudentTotal(studentMarksByExerciseId[student.id])}
                </p>
              </div>
            </div>
          </div>
        {:else}
          <Box>
            <AudioConsoleIcon size={32} class="carbon-icon w-80" />
            <h3 class="text-3xl text-gray-500 dark:text-white">
              {$t('course.navItem.marks.no_student')}
            </h3>
          </Box>
        {/each}
      </div>
    </PageBody>
  </RoleBasedSecurity>
</CourseContainer>

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
