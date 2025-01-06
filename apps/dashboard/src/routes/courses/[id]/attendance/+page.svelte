<script lang="ts">
  import { browser } from '$app/environment';
  import Box from '$lib/components/Box/index.svelte';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';
  import { getLectureNo } from '$lib/components/Course/function.js';
  import { course, group } from '$lib/components/Course/store';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { ROLE } from '$lib/utils/constants/roles';
  import { t } from '$lib/utils/functions/translations';
  import { takeAttendance } from '$lib/utils/services/attendance';
  import { globalStore } from '$lib/utils/store/app';
  import { attendance } from '$lib/utils/store/attendance';
  import { profile } from '$lib/utils/store/user';
  import type { GroupPerson, Lesson } from '$lib/utils/types/index';
  import {
    Checkbox,
    Pagination,
    Search,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';
  import AudioConsoleIcon from 'carbon-icons-svelte/lib/AudioConsole.svelte';

  export let data;

  interface CourseData {
    attendance: {
      student_id: string;
      lesson_id: string;
      is_present: boolean;
      id: number;
    }[];
  }

  let students: GroupPerson[] = [];
  let searchValue = '';

  function setAttendance(courseData: CourseData) {
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

  function handleAttendanceChange(e: any, student: GroupPerson, lesson: Lesson) {
    if ($globalStore.isStudent) return;

    const attendanceItem = $attendance[student.id]
      ? $attendance[student.id][lesson.id] || { id: undefined }
      : { id: undefined };

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
        snackbar.error('snackbar.attendance.error.reload');
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
  function searchStudents(query: string, _students: GroupPerson[]) {
    const lowercaseQuery = query.toLowerCase();
    return _students.filter((student) =>
      student.profile?.fullname?.toLowerCase()?.includes(lowercaseQuery)
    );
  }

  async function firstRender(courseId: string) {
    if (courseId) {
      if (!Object.keys($attendance).length) {
        setAttendance($course);
      }
      return;
    }
  }

  $: students = $globalStore.isStudent
    ? $group.people.filter((person) => !!person.profile && person.profile.id === $profile.id)
    : $group.people.filter((person) => !!person.profile && person.role_id === ROLE.STUDENT);

  $: browser && $course.id && firstRender($course.id);
</script>

<CourseContainer bind:courseId={data.courseId}>
  <PageNav title={$t('course.navItem.attendance.title')} />
  <PageBody width="w-full max-w-6xl md:w-11/12">
    <section class="mx-2 my-5 flex items-center lg:mx-9">
      <div
        class="flex w-full flex-col items-start justify-between gap-2 lg:flex-row lg:items-center"
      >
        <div class="flex">
          <p class="mr-5 flex items-center">
            <Checkbox checked disabled />
            {$t('course.navItem.attendance.present')}
          </p>
          <p class="flex items-center">
            <Checkbox disabled />
            {$t('course.navItem.attendance.absent')}
          </p>
        </div>
        <div>
          <Search
            class="dark:text-slate-950"
            placeholder={$t('course.navItem.attendance.search_students')}
            bind:value={searchValue}
          />
        </div>
      </div>
    </section>

    <section class="mx-2 my-5 lg:mx-9">
      <StructuredList class="relative m-0">
        <!-- Moved the lesson headers outside the students loop -->
        <StructuredListHead class="bg-primary-100">
          <StructuredListRow head class="mx-7">
            <StructuredListCell head class="text-primary-600 py-3"
              >{$t('course.navItem.attendance.student')}</StructuredListCell
            >
            {#each $lessons as lesson, index}
              <StructuredListCell head class="text-primary-600 py-3"
                >{$t('course.navItem.attendance.lesson')} 0{getLectureNo(
                  index + 1
                )}</StructuredListCell
              >
            {/each}
          </StructuredListRow>
        </StructuredListHead>

        {#each searchStudents(searchValue, students) as student}
          <StructuredListBody>
            <StructuredListRow>
              <StructuredListCell>
                <div class="flex w-1/4 items-center">
                  <p class="font-semibold dark:text-white">
                    {student.profile.fullname}
                  </p>
                </div>
              </StructuredListCell>
              {#each $lessons as lesson}
                <StructuredListCell class="">
                  <Checkbox
                    class={$globalStore.isStudent ? 'cursor-not-allowed' : ''}
                    disabled={$globalStore.isStudent}
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
          <h3 class="text-center text-3xl text-gray-500 dark:text-white">
            {$t('course.navItem.attendance.no_student')}
          </h3>
        </Box>
      {/if}
      {#if students.length !== 0}
        <Pagination totalItems={10} pageSizes={[10, 15, 20]} />
      {/if}
    </section>
  </PageBody>
</CourseContainer>
