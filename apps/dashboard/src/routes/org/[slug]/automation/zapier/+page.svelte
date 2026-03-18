<script>
  import { ZapierAutomationPage } from '$features/automation/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>{t.get('automation.tabs.zapier')} - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('automation.tabs.zapier')}</Page.Title>
    <Page.Subtitle>{$t('automation.coming_soon')}</Page.Subtitle>
  </Page.HeaderContent>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <ZapierAutomationPage />
  {/snippet}
</Page.Body>
