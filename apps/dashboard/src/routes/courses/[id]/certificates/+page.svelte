<script lang="ts">
  import { CertificatesPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

<svelte:head>
  <title>Certificates - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>
      {$t('course.navItem.certificates.title')}
    </Page.Title>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <CertificatesPage courseId={data.courseId} />
  {/snippet}
</Page.Body>
