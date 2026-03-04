<script lang="ts">
  import { EmailTemplateSettingsPage } from '$features/email-template/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>{t.get('settings.email_templates.title')} - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.email_templates.title')}</Page.Title>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <EmailTemplateSettingsPage />
  {/snippet}
</Page.Body>
