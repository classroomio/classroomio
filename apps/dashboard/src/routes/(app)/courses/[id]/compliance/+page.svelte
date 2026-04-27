<script lang="ts">
  import { CompliancePage } from '$features/course/pages';
  import { complianceApi, courseApi } from '$features/course/api';
  import { RefreshPageData } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';

  let { data } = $props();

  async function refreshCompliancePage() {
    complianceApi.reset();
    await courseApi.refreshCourse(data.courseId, $profile.id);
  }
</script>

<Page.Root class="mx-auto flex md:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('course.navItem.compliance.title')}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <RefreshPageData onRefresh={refreshCompliancePage} />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CompliancePage />
    {/snippet}
  </Page.Body>
</Page.Root>
