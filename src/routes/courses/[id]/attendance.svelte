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
  import {
    course,
    group,
    setCourseData,
  } from '../../../components/Course/store';
  import { getLectureNo } from '../../../components/Course/function';
  import { fetchCourse } from '../../../utils/services/courses';
  import { lessons } from '../../../components/Course/components/Lesson/store/lessons';
  import { ROLE } from '../../../utils/constants/roles';
  import { takeAttendance } from '../../../utils/services/attendance';
  import { snackbarStore } from '../../../components/Snackbar/store';
  import { SNACKBAR_SEVERITY } from '../../../components/Snackbar/constants';
  import { attendance } from '../../../utils/store/attendance';
  import { profile } from '../../../utils/store/user';

  export let courseId;

  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';
  let students = [];
  let isStudent;

  function setAttendance(courseData) {
    for (const attendanceItem of courseData.attendance) {
      const { student_id, lesson_id, is_present, id } = attendanceItem;

      if (!$attendance[student_id]) {
        $attendance[student_id] = {
          [lesson_id]: {
            id,
            is_present,
          },
        };
      } else {
        $attendance[student_id] = {
          ...$attendance[student_id],
          [lesson_id]: {
            id,
            is_present,
          },
        };
      }
    }
  }

  function handleAttendanceChange(e, student, lesson) {
    if (isStudent) return;

    const attendanceItem = $attendance[student.id]
      ? $attendance[student.id][lesson.id] || {}
      : {};

    /* 
    This validation is useless. We shouldn't assume we already have an attendance item id 
    because it might be a new attendance.
    if (!attendanceItem.id) {
      $snackbarStore.open = true;
      $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
      $snackbarStore.message =
        "Something isn't right. Please reload and take attendance again";
      console.error(`Attendance Id Missing`, courseId, student.id, lesson.id);

      return;
    }
    */

    const data = {
      id: attendanceItem.id,
      student_id: student.id,
      is_present: e.target.checked,
      lesson_id: lesson.id,
      course_id: courseId,
    };

    takeAttendance(data).then((res) => {
      if (res.error) {
        console.error(`res.error`, res.error);
        $snackbarStore.open = true;
        $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
        $snackbarStore.message =
          "Something isn't right.  Please reload and take attendance again";
      } else {
        // console.log('res', JSON.stringify(res));
        const { id, is_present } = res.data[0];
        if ($attendance[student.id]) {
          $attendance[student.id][lesson.id] = {
            id,
            is_present,
          };
        } else {
          $attendance[student.id] = {
            [lesson.id]: {
              id,
              is_present,
            },
          };
        }
      }
    });
  }

  onMount(async () => {
    if ($course.id) {
      if (!Object.keys($attendance).length) {
        setAttendance($course);
      }
      return;
    }

    const { data } = await fetchCourse(courseId);
    setCourseData(data);
    setAttendance(data);
  });

  $: students = isStudent
    ? $group.people.filter(
        (person) => !!person.profile && person.profile.id === $profile.id
      )
    : $group.people.filter(
        (person) => !!person.profile && person.role_id === ROLE.STUDENT
      );
</script>

<CourseContainer bind:isStudent>
  <PageNav title="Attendance" />
  <PageBody>
    <div class="table rounded-md border border-gray-300 w-full">
      <div
        class="flex items-center font-bold border-t-0 {borderBottomGrey} p-3"
      >
        <p class="w-1/4">Student</p>
        {#each $lessons as lesson, index}
          <p class="col" title={lesson.title}>
            {getLectureNo(index + 1)}
          </p>
        {/each}
      </div>

      {#each students as student}
        <div
          class="flex relative items-center p-3 cursor-pointer {borderBottomGrey}"
        >
          <div class="w-1/4 flex items-center">
            <img
              alt="Student avatar"
              src={student.profile.avatar_url}
              class="w-8 h-8 rounded-full mr-2"
            />
            <div class="text-sm">
              <p class="font-semibold">{student.profile.fullname}</p>
              {#if student.assigned_student_id}
                <p>#{student.assigned_student_id}</p>
              {/if}
            </div>
          </div>
          {#each $lessons as lesson}
            <p class="col">
              <input
                class="form-radio {isStudent && 'cursor-not-allowed'}"
                type="checkbox"
                disabled={isStudent}
                checked={$attendance[student.id]
                  ? $attendance[student.id][lesson.id]
                    ? $attendance[student.id][lesson.id].is_present
                    : false
                  : false}
                on:change={(e) => handleAttendanceChange(e, student, lesson)}
              />
            </p>
          {/each}
        </div>
      {:else}
        <Box>
          <AudioConsole32 class="carbon-icon w-80" />
          <h3 class="text-3xl text-gray-500">No Student Added</h3>
        </Box>
      {/each}
    </div>
  </PageBody>
</CourseContainer>

<style>
  .col {
    width: 50px;
  }
</style>
