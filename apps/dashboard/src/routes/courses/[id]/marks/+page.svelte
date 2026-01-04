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
  import { courseApi, lessonApi } from '$features/course/api';
  import { generateMarksCSV, generateMarksPDF } from '$features/course/utils/marks-utils';

  let { data } = $props();

  let isDownloading = $state(false);

  function getPageRoles(org: AccountOrg) {
    const roles = [1, 2];
    if (org.customization?.course?.grading) {
      roles.push(3);
    }
    return roles;
  }

  const downloadCSV = () => {
    if (!data.marksData) return;
    isDownloading = true;
    try {
      generateMarksCSV(
        data.marksData.students,
        lessonApi.lessons,
        data.marksData.lessonMapping,
        data.marksData.studentMarksByExerciseId,
        courseApi.course?.title || 'Course'
      );
    } finally {
      isDownloading = false;
    }
  };

  const downloadPDF = () => {
    if (!data.marksData) return;
    isDownloading = true;
    try {
      generateMarksPDF(
        data.marksData.students,
        lessonApi.lessons,
        data.marksData.lessonMapping,
        data.marksData.studentMarksByExerciseId,
        courseApi.course?.title || 'Course'
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      isDownloading = false;
    }
  };
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
      <MarksPage marksData={data.marksData} />
    {/snippet}
  </Page.Body>
</RoleBasedSecurity>
