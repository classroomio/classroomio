<script lang="ts">
  import { Input } from '@cio/ui/base/input';
  import * as Table from '@cio/ui/base/table';
  import Search from '@lucide/svelte/icons/search';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Pagination from '@cio/ui/base/pagination';

  import { profile } from '$lib/utils/store/user';
  import { ROLE } from '@cio/utils/constants';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { attendance } from '$lib/utils/store/attendance';
  import { snackbar } from '$features/ui/snackbar/store';
  import { course, group } from '$lib/components/Course/store';
  import { takeAttendance } from '$lib/utils/services/attendance';
  import { getLectureNo } from '$lib/components/Course/function.js';
  import type { GroupPerson, Lesson } from '$lib/utils/types/index';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';

  import { Empty } from '@cio/ui/custom/empty';
  import UserXIcon from '@lucide/svelte/icons/user-x';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();
  let hasFetched = $state(false);

  interface CourseData {
    attendance: {
      student_id: string;
      lesson_id: string;
      is_present: boolean;
      id: number;
    }[];
  }

  const students: GroupPerson[] = $derived(
    $globalStore.isStudent
      ? $group.people.filter((person) => !!person.profile && person.profile.id === $profile.id)
      : $group.people.filter((person) => !!person.profile && person.role_id === ROLE.STUDENT)
  );
  let searchValue = $state('');
  let currentPage = $state(1);
  let pageSize = $state(10);

  const filteredStudents = $derived(searchStudents(searchValue, students));
  const totalStudents = $derived(filteredStudents.length);
  const paginatedStudents = $derived(filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize));

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

    const _data = {
      id: attendanceItem.id,
      student_id: student.id,
      is_present: e.target.checked,
      lesson_id: lesson.id,
      course_id: courseId
    };

    takeAttendance(_data).then((res) => {
      if (res.error) {
        console.error(`res.error`, res.error);
        snackbar.error('snackbar.attendance.error.reload');
      } else {
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
    return _students.filter((student) => student.profile?.fullname?.toLowerCase()?.includes(lowercaseQuery));
  }

  async function firstRender(courseId?: string) {
    if (!courseId || hasFetched) return;

    hasFetched = true;

    if (!Object.keys($attendance).length) {
      setAttendance($course);
    }
    return;
  }

  $effect(() => {
    firstRender($course.id);
  });
</script>

<section class="mx-2 my-5 flex items-center lg:mx-9">
  <div class="flex w-full flex-col items-start justify-between gap-2 lg:flex-row lg:items-center">
    <div class="flex gap-5">
      <p class="flex items-center gap-2">
        <Checkbox disabled />
        <span>{$t('course.navItem.attendance.present')}</span>
      </p>
      <p class="flex items-center gap-2">
        <Checkbox disabled />
        <span>{$t('course.navItem.attendance.absent')}</span>
      </p>
    </div>

    <div class="relative w-full">
      <Input type="text" placeholder={$t('course.navItem.attendance.search_students')} bind:value={searchValue} />

      <Search class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
    </div>
  </div>
</section>

<section class="mx-2 my-5 lg:mx-9">
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-1/4">{$t('course.navItem.attendance.student')}</Table.Head>
          {#each $lessons as _lesson, index}
            <Table.Head class="text-center"
              >{$t('course.navItem.attendance.lesson')} 0{getLectureNo(index + 1)}</Table.Head
            >
          {/each}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each paginatedStudents as student}
          <Table.Row>
            <Table.Cell class="font-semibold">
              {student.profile.fullname}
            </Table.Cell>
            {#each $lessons as lesson}
              <Table.Cell class="text-center">
                <div class="flex justify-center">
                  <Checkbox
                    disabled={$globalStore.isStudent}
                    checked={$attendance[student.id]
                      ? $attendance[student.id][lesson.id]
                        ? $attendance[student.id][lesson.id].is_present
                        : false
                      : false}
                    onCheckedChange={(checked) => {
                      const e = { target: { checked } };
                      handleAttendanceChange(e, student, lesson);
                    }}
                  />
                </div>
              </Table.Cell>
            {/each}
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
  {#if students.length === 0}
    <Empty title={$t('course.navItem.attendance.no_student')} icon={UserXIcon} variant="page" />
  {/if}
  {#if totalStudents > 0}
    <div class="mt-4">
      <Pagination.Root
        count={totalStudents}
        perPage={pageSize}
        page={currentPage}
        onPageChange={(page) => (currentPage = page)}
      >
        {#snippet children({ pages, currentPage: activePage })}
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.PrevButton />
            </Pagination.Item>
            {#each pages as page (page.key)}
              {#if page.type === 'ellipsis'}
                <Pagination.Item>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link {page} isActive={activePage === page.value}>
                    {page.value}
                  </Pagination.Link>
                </Pagination.Item>
              {/if}
            {/each}
            <Pagination.Item>
              <Pagination.NextButton />
            </Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    </div>
  {/if}
</section>
