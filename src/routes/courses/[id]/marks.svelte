<script context="module">
  export async function preload({ params }) {
    return { courseId: params.id };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import AudioConsole32 from 'carbon-icons-svelte/lib/AudioConsole32';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import PageNav from '../../../components/PageNav/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import Box from '../../../components/Box/index.svelte';
  import { ROLE } from '../../../utils/constants/roles';
  import { setCourse, course, group } from '../../../components/Course/store';
  import { lessons } from '../../../components/Course/components/Lesson/store/lessons';
  import {
    fetchCourse,
    fetchExercisesByMarks,
  } from '../../../utils/services/courses';
  import { getLectureNo } from '../../../components/Course/function';
  import { fetchMarks } from '../../../utils/services/marks';
  import { profile } from '../../../utils/store/user';

  export let courseId;

  let borderBottomGrey =
    'border-r-0 border-t-0 border-b border-l-0 border-gray-300';
  let borderleftGrey =
    'border-r-0 border-t-0 border-b-0 border-l border-gray-300';
  let students = [];
  let isStudent = false;

  let lessonMapping = {}; // { lessonId: { exerciseId: exerciseTitle, ... }, ... }
  let studentMarksByExerciseId = {}; // { groupMemberId: { exerciseId: `total_gotten/points`, ... }, ... }

  function calculateStudentTotal(studentExerciseData) {
    if (!studentExerciseData) return 0;

    return Object.values(studentExerciseData).reduce(
      (total, point) => (total += parseInt(point)),
      0
    );
  }

  onMount(async () => {
    if (!$course.id) {
      const { data } = await fetchCourse(courseId);
      setCourse(data);
    }

    const { data: marks } = await fetchMarks(courseId);

    marks.forEach((mark) => {
      const { groupmember_id, exercise_id, total_points_gotten } = mark;

      if (studentMarksByExerciseId[groupmember_id]) {
        studentMarksByExerciseId[groupmember_id] = {
          ...studentMarksByExerciseId[groupmember_id],
          [exercise_id]: total_points_gotten,
        };
      } else {
        studentMarksByExerciseId[groupmember_id] = {
          [exercise_id]: total_points_gotten,
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
          [exercise_id]: { title: exercise_title, points },
        };
      } else {
        lessonMapping[lesson_id] = {
          [exercise_id]: { title: exercise_title, points },
        };
      }
    });
  });

  $: {
    students = isStudent
      ? $group.people.filter(
          (person) => !!person.profile && person.profile.id === $profile.id
        )
      : $group.people.filter(
          (person) => !!person.profile && person.role_id === ROLE.STUDENT
        );
  }
</script>

<CourseContainer bind:isStudent>
  <PageNav title="Marks" />

  <PageBody width="w-11/12">
    <div class="table rounded-md border border-gray-300 w-auto">
      <div class="flex items-center {borderBottomGrey}">
        <div class="box flex items-center p-3">
          <p class="dark:text-white w-40">Student</p>
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
                    class="col text-sm dark:text-white {index &&
                      borderleftGrey}"
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
          <p class="dark:text-white w-20 text-center">Total</p>
        </div>
      </div>

      {#each students as student}
        <div
          class="flex relative items-center p-3 cursor-pointer {borderBottomGrey}"
        >
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
                {`${
                  student.assigned_student_id
                    ? '#' + student.assigned_student_id
                    : '-'
                }`}
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
          <AudioConsole32 class="carbon-icon w-80" />
          <h3 class="text-3xl text-gray-500 dark:text-gray-200">
            No Student Added
          </h3>
        </Box>
      {/each}
    </div>
  </PageBody>
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
