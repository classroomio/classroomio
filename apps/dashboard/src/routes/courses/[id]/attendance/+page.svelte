<script lang="ts">
  import { AttendancePage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

<svelte:head>
  <title>Attendance - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>
      {$t('course.navItem.attendance.title')}
    </Page.Title>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <AttendancePage courseId={data.courseId} />
  {/snippet}
</Page.Body>
