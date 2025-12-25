<script>
  import { DomainsPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Custom domain - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('components.settings.domains.title')}</Page.Title>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <DomainsPage />
  {/snippet}
</Page.Body>
