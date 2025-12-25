<script lang="ts">
  import { IntegrationsPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Integrations - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.integrations.heading')}</Page.Title>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <IntegrationsPage />
  {/snippet}
</Page.Body>
