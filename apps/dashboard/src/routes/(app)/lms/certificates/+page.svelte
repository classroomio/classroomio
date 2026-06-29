<script lang="ts">
  import { CertificatesPage } from '$features/lms/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Certificates - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('certificates.heading')}</Page.Title>
      <Page.Subtitle>{$t('certificates.description')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CertificatesPage />
    {/snippet}
  </Page.Body>
</Page.Root>
