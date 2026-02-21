<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { Search } from '@cio/ui/custom/search';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Pagination from '@cio/ui/base/pagination';
  import { Empty } from '@cio/ui/custom/empty';
  import UserXIcon from '@lucide/svelte/icons/user-x';

  import { profile } from '$lib/utils/store/user';
  import { ROLE } from '@cio/utils/constants';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi, attendanceApi } from '$features/course/api';
  import { getLectureNo } from '$features/course/utils/functions';
  import type { CourseMember, CourseMembers, CourseContentItem } from '$features/course/utils/types';
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  const students: CourseMembers = $derived(
    $globalStore.isStudent
      ? courseApi.group.people.filter((person) => !!person.profile && person.profile.id === $profile.id)
      : courseApi.group.people.filter((person) => !!person.profile && Number(person.roleId) === ROLE.STUDENT)
  );
  let searchValue = $state('');
  let currentPage = $state(1);
  let pageSize = $state(10);

  const filteredStudents = $derived(searchStudents(searchValue, students));
  const totalStudents = $derived(filteredStudents.length);
  const paginatedStudents = $derived(filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  const contentData = $derived(getCourseContent(courseApi.course));
  const lessonItems = $derived(
    (contentData.grouped ? contentData.sections.flatMap((section) => section.items) : contentData.items).filter(
      (item) => item.type === ContentType.Lesson
    )
  );

  const attendanceLookup = $derived.by(() => {
    if (!courseApi.course?.attendance) return {};

    const lookup: Record<string, Record<string, { id: number; isPresent: boolean }>> = {};
    for (const attendanceItem of courseApi.course.attendance) {
      const studentId = attendanceItem.studentId;
      const lessonId = attendanceItem.lessonId;
      const isPresent = attendanceItem.isPresent ?? false;
      const id = attendanceItem.id;

      if (!studentId || !lessonId) continue;

      if (!lookup[studentId]) {
        lookup[studentId] = {};
      }
      lookup[studentId][lessonId] = {
        id: Number(id),
        isPresent
      };
    }
    return lookup;
  });

  // Helper function to get attendance status for a student and lesson
  function getAttendanceStatus(studentId: string, lessonId: string): boolean {
    return attendanceLookup[studentId]?.[lessonId]?.isPresent ?? false;
  }

  async function handleAttendanceChange(e: any, student: CourseMember, lesson: CourseContentItem) {
    if ($globalStore.isStudent) return;

    const isPresent = e.target.checked;

    const result = await attendanceApi.upsert({
      courseId,
      lessonId: lesson.id,
      studentId: student.id,
      isPresent
    });

    if (result?.data && courseApi.course) {
      const {
        id,
        isPresent: responseIsPresent,
        studentId: responseStudentId,
        lessonId: responseLessonId
      } = result.data;

      // Update courseApi.course.attendance array
      const existingIndex = courseApi.course.attendance.findIndex(
        (item) => item.studentId === responseStudentId && item.lessonId === responseLessonId
      );

      if (existingIndex >= 0) {
        // Update existing attendance record
        courseApi.course.attendance[existingIndex] = {
          ...courseApi.course.attendance[existingIndex],
          id: Number(id),
          isPresent: responseIsPresent ?? false
        };
      } else {
        // Add new attendance record
        courseApi.course.attendance = [
          ...courseApi.course.attendance,
          {
            id: Number(id),
            studentId: responseStudentId ?? student.id,
            lessonId: responseLessonId ?? lesson.id,
            isPresent: responseIsPresent ?? false,
            courseId: courseId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
    }
  }

  // function for the searchbar
  function searchStudents(query: string, _students: CourseMembers) {
    const lowercaseQuery = query.toLowerCase();
    return _students.filter((student) => student.profile?.fullname?.toLowerCase()?.includes(lowercaseQuery));
  }
</script>

<section class="flex items-center">
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

    <Search placeholder={$t('course.navItem.attendance.search_students')} bind:value={searchValue} />
  </div>
</section>

<section class="my-2 space-y-4">
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-1/4">{$t('course.navItem.attendance.student')}</Table.Head>
          {#each lessonItems as _lesson, index}
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
              {student.profile?.fullname}
            </Table.Cell>
            {#each lessonItems as lesson}
              <Table.Cell class="text-center">
                <div class="flex justify-center">
                  <Checkbox
                    disabled={$globalStore.isStudent}
                    checked={getAttendanceStatus(student.id, lesson.id)}
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
