<script lang="ts">
  import jsPDF from 'jspdf';
  import Papa from 'papaparse';
  import { goto } from '$app/navigation';
  import autoTable from 'jspdf-autotable';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import BadgeXIcon from '@lucide/svelte/icons/badge-x';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';

  import { currentOrg } from '$lib/utils/store/org';
  import type { GroupPerson } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { fetchMarks } from '$lib/utils/services/marks';
  import type { AccountOrg } from '$features/app/types';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { getLectureNo } from '$lib/components/Course/function.js';
  import { fetchExercisesByMarks } from '$lib/utils/services/courses';

  import Box from '$lib/components/Box/index.svelte';
  import { course } from '$lib/components/Course/store';
  import { PageBody } from '$lib/components/Page';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import * as Page from '@cio/ui/base/page';
  import { RoleBasedSecurity } from '$features/ui';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';

  let { data } = $props();

  let borderBottomGrey = 'border-r-0 border-t-0 border-b border-l-0 border-gray-300';
  let borderleftGrey = 'border-r-0 border-t-0 border-b-0 border-l border-gray-300';
  let students: GroupPerson[] = $state([]);
  let lessonMapping: Record<string, Record<string, { title: string; points: number }>> = $state({}); // { lessonId: { exerciseId: exerciseTitle, ... }, ... }
  let studentMarksByExerciseId: Record<string, Record<string, string>> = $state({}); // { groupMemberId: { exerciseId: `total_gotten/points`, ... }, ... }
  let isDownloading = $state(false);
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
  // TODO WRITE A REDIRECT FUNCTION FOR THIS THIS PAGE

  function getPageRoles(org: AccountOrg) {
    const roles = [1, 2];

    if (org.customization?.course?.grading) {
      roles.push(3);
    }

    return roles;
  }

  const downloadCSV = () => {
    isDownloading = true;

    const exportData = students.map((student) => {
      const rowData = {
        name: student.profile.fullname,
        email: student.profile.email,
        Total: 0
      };

      const totalPoints = calculateStudentTotal(studentMarksByExerciseId[student.id]);

      $lessons.forEach((lesson, lessonIndex) => {
        const quizzes = lessonMapping[lesson.id] || {};
        const quizMark = studentMarksByExerciseId[student.id] || {};

        Object.keys(quizzes).forEach((quizId) => {
          const quiz = quizzes[quizId];
          const key = `L${lessonIndex + 1} - ${quiz.title} (${lesson.title})`;

          rowData[key] = quizMark[quizId] || '-';
        });
      });

      rowData['Total'] = totalPoints;
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

    isDownloading = false;
  };

  function downloadPDF() {
    isDownloading = true;

    try {
      const doc = new jsPDF({
        orientation: 'landscape'
      });

      // Construct Headers
      const head = [['Student']]; // Starting with 'Student' as the first header
      $lessons.forEach((lesson, lessonIndex) => {
        if (lessonMapping[lesson.id]) {
          Object.values(lessonMapping[lesson.id]).forEach((exercise) => {
            head[0].push(`${getLectureNo(lessonIndex + 1)} - ${exercise.title} (${lesson.title})`);
          });
        }
      });
      head[0].push('Total'); // Add 'Total' as the last header

      // Construct Rows
      const body = students.map((student) => {
        const row: string[] = [];
        row.push(student?.profile?.fullname ?? ''); // Student name

        $lessons.forEach((lesson) => {
          if (lessonMapping[lesson.id]) {
            Object.keys(lessonMapping[lesson.id]).forEach((exerciseId) => {
              const mark: string = studentMarksByExerciseId?.[student.id]?.[exerciseId] || '-';
              row.push(mark);
            });
          }
        });

        // Calculate total
        const total = '' + calculateStudentTotal(studentMarksByExerciseId[student.id]);
        row.push(total);

        return row;
      });

      // Generate the table in PDF
      autoTable(doc, {
        head,
        body,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] },
        footStyles: { fillColor: [22, 160, 133] },
        didDrawPage: function (data) {
          // Header
          doc.setFontSize(14);
          doc.setTextColor(40);
          doc.text(`${$course?.title} - Marks`, data.settings.margin.left, 10);
        }
      });

      // Save the PDF
      doc.save(`${$course?.title}-marks.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      isDownloading = false;
    }
  }

  $effect(() => {
    firstRender($course.id);
  });
</script>

<CourseContainer courseId={data.courseId}>
  <RoleBasedSecurity
    allowedRoles={getPageRoles($currentOrg)}
    onDenied={() => {
      goto(`/courses/${data.courseId}/lessons?next=true`);
    }}
  >
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t('course.navItem.attendance.title')}
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        <div class="flex w-full justify-end gap-2">
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="ghost" size="icon" class="rounded-full">
                  {#if isDownloading}
                    <Progress />
                  {:else}
                    <DownloadIcon size={16} />
                  {/if}
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item onclick={downloadCSV}>
                  {$t('course.navItem.marks.export.csv')}
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={downloadPDF}>
                  {$t('course.navItem.marks.export.pdf')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </RoleBasedSecurity>
        </div>
      </Page.Action>
    </Page.Header>

    <PageBody width="w-full max-w-6xl md:w-11/12">
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
                <div class="flex h-full items-center border-b-0 border-l-0 border-r-0 border-t border-gray-300">
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
                      {studentMarksByExerciseId[student.id]
                        ? studentMarksByExerciseId[student.id][exerciseId] || '-'
                        : '-'}
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
          <Box>
            <BadgeXIcon size={16} />
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
