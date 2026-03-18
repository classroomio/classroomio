<script lang="ts">
  import { AttendancePage } from '$features/course/pages';
  import { courseApi } from '$features/course/api';
  import { RefreshPageData } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';

  let { data } = $props();
</script>

<Page.Root class="mx-auto flex w-[calc(100vw-var(--sidebar-width))]!">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('course.navItem.attendance.title')}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <RefreshPageData onRefresh={() => courseApi.refreshCourse(data.courseId, $profile.id)} />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AttendancePage courseId={data.courseId} />
    {/snippet}
  </Page.Body>
</Page.Root>
