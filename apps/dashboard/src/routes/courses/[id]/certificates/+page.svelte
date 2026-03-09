<script lang="ts">
  import { CertificatesPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
</script>

<Page.Root class="mx-auto flex w-[calc(100vw-var(--sidebar-width))]!">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('course.navItem.certificates.title')}
      </Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CertificatesPage />
    {/snippet}
  </Page.Body>
</Page.Root>
