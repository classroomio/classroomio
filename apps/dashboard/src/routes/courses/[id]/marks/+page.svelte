<script lang="ts">
  import { goto } from '$app/navigation';
  import { MarksPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { AccountOrg } from '$features/app/types';
  import { currentOrg } from '$lib/utils/store/org';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import jsPDF from 'jspdf';
  import Papa from 'papaparse';
  import autoTable from 'jspdf-autotable';
  import { course } from '$features/course/store';
  import { lessons } from '$features/course/components/lesson/store/lessons';
  import type { GroupPerson } from '$lib/utils/types';
  import { getLectureNo } from '$features/course/utils/functions';

  let { data } = $props();

  let isDownloading = $state(false);
  let students: GroupPerson[] = $state([]);
  let lessonMapping: Record<string, Record<string, { title: string; points: number }>> = $state({});
  let studentMarksByExerciseId: Record<string, Record<string, string>> = $state({});

  function calculateStudentTotal(studentExerciseData) {
    if (!studentExerciseData) return 0;
    return Object.values(studentExerciseData).reduce((total: number, point) => (total += parseInt(point as string)), 0);
  }

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
      const doc = new jsPDF({ orientation: 'landscape' });
      const head = [['Student']];
      $lessons.forEach((lesson, lessonIndex) => {
        if (lessonMapping[lesson.id]) {
          Object.values(lessonMapping[lesson.id]).forEach((exercise) => {
            head[0].push(`${getLectureNo(lessonIndex + 1)} - ${exercise.title} (${lesson.title})`);
          });
        }
      });
      head[0].push('Total');
      const body = students.map((student) => {
        const row: string[] = [];
        row.push(student?.profile?.fullname ?? '');
        $lessons.forEach((lesson) => {
          if (lessonMapping[lesson.id]) {
            Object.keys(lessonMapping[lesson.id]).forEach((exerciseId) => {
              const mark: string = studentMarksByExerciseId?.[student.id]?.[exerciseId] || '-';
              row.push(mark);
            });
          }
        });
        const total = '' + calculateStudentTotal(studentMarksByExerciseId[student.id]);
        row.push(total);
        return row;
      });
      autoTable(doc, {
        head,
        body,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] },
        footStyles: { fillColor: [22, 160, 133] },
        didDrawPage: function (data) {
          doc.setFontSize(14);
          doc.setTextColor(40);
          doc.text(`${$course?.title} - Marks`, data.settings.margin.left, 10);
        }
      });
      doc.save(`${$course?.title}-marks.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      isDownloading = false;
    }
  }
</script>

<svelte:head>
  <title>Marks - ClassroomIO</title>
</svelte:head>

<RoleBasedSecurity
  allowedRoles={getPageRoles($currentOrg)}
  onDenied={() => {
    goto(`/courses/${data.courseId}/lessons?next=true`);
  }}
>
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('course.navItem.marks.title')}
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

  <Page.Body>
    {#snippet child()}
      <MarksPage />
    {/snippet}
  </Page.Body>
</RoleBasedSecurity>
