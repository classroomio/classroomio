<script>
  import { AutomationPage } from '$features/automation/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>{t.get('automation.title')} - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('automation.title')}</Page.Title>
    <Page.Subtitle>{$t('automation.subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <AutomationPage />
  {/snippet}
</Page.Body>
