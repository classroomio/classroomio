<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import { BackButton } from '@cio/ui';

  import { UserAnalyticsPage } from '$features/audience/pages';
  import { STATUS } from '$features/course/components/exercise/constants';
  import { exportOrgStudentProgress } from '$features/course/utils/export-progress';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
  import type { AudienceAnalytics } from '$features/audience/utils/types';

  let { data } = $props();

  function exportRows(analytics: AudienceAnalytics) {
    const rows = analytics.courses.map((course) => ({
      courseTitle: course.title,
      progress: course.progress_percentage,
      exercisesCompleted: course.exercises_completed,
      exercisesCount: course.exercises_count,
      averageGrade: course.average_grade
    }));
    const studentName = analytics.user.fullName || analytics.user.email || 'student';
    exportOrgStudentProgress(rows, studentName);
  }
</script>

<svelte:head>
  <title>{t.get('audience.user_analytics.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full md:max-w-5xl lg:mx-auto">
  <Page.Header>
    <Page.HeaderContent>
      <BackButton href={`${$currentOrgPath}/audience`} label={$t('community.ask.go_back')} />
    </Page.HeaderContent>
    <Page.Action>
      {#if data.analytics}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="secondary"
                size="icon"
                aria-label={$t('audience.user_analytics.student_actions')}
              >
                <EllipsisIcon />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onclick={() => exportRows(data.analytics)}>
              <DownloadIcon />
              {$t('audience.user_analytics.export_progress')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <UserAnalyticsPage {data} />
    {/snippet}
  </Page.Body>
</Page.Root>
