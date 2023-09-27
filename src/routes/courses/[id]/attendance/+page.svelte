<script>
  import { onMount } from 'svelte';
  import {
    Search,
    Checkbox,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    Pagination
  } from 'carbon-components-svelte';
  import AudioConsoleIcon from 'carbon-icons-svelte/lib/AudioConsole.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { course, group, setCourse } from '$lib/components/Course/store';
  import { getLectureNo } from '$lib/components/Course/function';
  import { fetchCourse } from '$lib/utils/services/courses';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';
  import { ROLE } from '$lib/utils/constants/roles';
  import { takeAttendance } from '$lib/utils/services/attendance';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { attendance } from '$lib/utils/store/attendance';
  import { profile } from '$lib/utils/store/user';

  export let data;

  let students = [];
  let isStudent;
  let searchValue = '';

  function setAttendance(courseData) {
    for (const attendanceItem of courseData.attendance) {
      const { student_id, lesson_id, is_present, id } = attendanceItem;

      if (!$attendance[student_id]) {
        $attendance[student_id] = {
          [lesson_id]: {
            id,
            is_present
          }
        };
      } else {
        $attendance[student_id] = {
          ...$attendance[student_id],
          [lesson_id]: {
            id,
            is_present
          }
        };
      }
    }
  }

  function handleAttendanceChange(e, student, lesson) {
    if (isStudent) return;

    const attendanceItem = $attendance[student.id] ? $attendance[student.id][lesson.id] || {} : {};

    /* 
    This validation is useless. We shouldn't assume we already have an attendance item id 
    because it might be a new attendance.
    if (!attendanceItem.id) {
      snackbar.error("Something isn't right. Please reload and take attendance again");
      console.error(`Attendance Id Missing`, courseId, student.id, lesson.id);
      return;
    }
    */

    const _data = {
      id: attendanceItem.id,
      student_id: student.id,
      is_present: e.target.checked,
      lesson_id: lesson.id,
      course_id: data.courseId
    };

    takeAttendance(_data).then((res) => {
      if (res.error) {
        console.error(`res.error`, res.error);
        snackbar.error("Something isn't right.  Please reload and take attendance again");
      } else {
        // console.log('res', JSON.stringify(res));
        const { id, is_present } = res.data[0];
        if ($attendance[student.id]) {
          $attendance[student.id][lesson.id] = {
            id,
            is_present
          };
        } else {
          $attendance[student.id] = {
            [lesson.id]: {
              id,
              is_present
            }
          };
        }
      }
    });
  }

  // function for the searchbar
  function searchStudents(query) {
    const lowercaseQuery = query.toLowerCase();
    return students.filter((student) =>
      student.profile.fullname.toLowerCase().includes(lowercaseQuery)
    );
  }

  onMount(async () => {
    if ($course.id) {
      if (!Object.keys($attendance).length) {
        setAttendance($course);
      }
      return;
    }

    const { data: _data } = await fetchCourse(data.courseId);
    setCourse(_data);
    setAttendance(_data);
  });

  $: students = isStudent
    ? $group.people.filter((person) => !!person.profile && person.profile.id === $profile.id)
    : $group.people.filter((person) => !!person.profile && person.role_id === ROLE.STUDENT);
  console.log(students);
</script>

<CourseContainer bind:isStudent>
  <PageNav title="Attendance" />
  <PageBody width="w-full max-w-6xl md:w-11/12">
    <section class="flex items-center mx-2 lg:mx-9 my-5">
      <div
        class="flex flex-col lg:flex-row items-start gap-2 lg:items-center justify-between w-full"
      >
        <div class="flex">
          <p class="flex items-center mr-5">
            <Checkbox checked disabled /> Present
          </p>
          <p class="flex items-center">
            <Checkbox disabled /> Absent
          </p>
        </div>
        <div>
          <Search
            class="dark:text-slate-950"
            placeholder="Search students"
            bind:value={searchValue}
          />
        </div>
      </div>
    </section>

    <section class="my-5 mx-2 lg:mx-9">
      <StructuredList class="m-0 relative">
        <!-- Moved the lesson headers outside the students loop -->
        <StructuredListHead class="bg-primary-100">
          <StructuredListRow head class="mx-7">
            <StructuredListCell head class="text-primary-600 py-3">Student</StructuredListCell>
            {#each $lessons as lesson, index}
              <StructuredListCell head class="text-primary-600 py-3"
                >Lesson 0{getLectureNo(index + 1)}</StructuredListCell
              >
            {/each}
          </StructuredListRow>
        </StructuredListHead>

        {#each searchStudents(searchValue) as student}
          <StructuredListBody>
            <StructuredListRow>
              <StructuredListCell>
                <div class="w-1/4 flex items-center">
                  <p class="dark:text-white font-semibold">
                    {student.profile.fullname}
                  </p>
                </div>
              </StructuredListCell>
              {#each $lessons as lesson}
                <StructuredListCell class="">
                  <Checkbox
                    class={isStudent && 'cursor-not-allowed'}
                    disabled={isStudent}
                    checked={$attendance[student.id]
                      ? $attendance[student.id][lesson.id]
                        ? $attendance[student.id][lesson.id].is_present
                        : false
                      : false}
                    on:change={(e) => handleAttendanceChange(e, student, lesson)}
                  />
                </StructuredListCell>
              {/each}
            </StructuredListRow>
          </StructuredListBody>
        {/each}
      </StructuredList>
      {#if students.length === 0}
        <Box className="h-[300px] w-full">
          <AudioConsoleIcon size={32} class="carbon-icon w-80" />
          <h3 class="text-3xl text-gray-500 dark:text-white text-center">No Student Added</h3>
        </Box>
      {/if}
      {#if students.length !== 0}
        <Pagination totalItems={10} pageSizes={[10, 15, 20]} />
      {/if}
    </section>
  </PageBody>
</CourseContainer>
