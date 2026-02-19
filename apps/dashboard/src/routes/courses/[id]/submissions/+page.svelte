<script lang="ts">
  import { SubmissionsPage } from '$features/course/pages';
  import { RoleBasedSecurity } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

<RoleBasedSecurity allowedRoles={[1, 2]}>
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('course.navItem.submissions.title')}
      </Page.Title>
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <SubmissionsPage
        courseId={data.courseId}
        sections={data.sections || []}
        submissionIdData={data.submissionIdData || {}}
      />
    {/snippet}
  </Page.Body>
</RoleBasedSecurity>
