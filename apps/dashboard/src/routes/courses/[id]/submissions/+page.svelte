<script lang="ts">
  import { SubmissionsPage } from '$features/course/pages';
  import { RoleBasedSecurity } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

<RoleBasedSecurity allowedRoles={[1, 2]}>
  <Page.Root class="mx-auto flex w-[calc(95vw-var(--sidebar-width))]!">
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
  </Page.Root>
</RoleBasedSecurity>
