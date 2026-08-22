<script lang="ts">
  import { NotificationsPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';

  let notificationsComponent: NotificationsPage | null = $state(null);
  let hasUnsavedChanges = $state(false);
  let isSaving = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      await notificationsComponent?.handleSaveAll();
    } finally {
      isSaving = false;
    }
  }

  function handleDiscard() {
    notificationsComponent?.handleDiscard();
  }
</script>

<svelte:head>
  <title>{t.get('settings.notifications.page_title')} - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.notifications.heading')}</Page.Title>
    <Page.Subtitle>{$t('settings.notifications.page_subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <NotificationsPage bind:this={notificationsComponent} bind:hasUnsavedChanges />
  {/snippet}
</Page.Body>
<Page.SettingsActions
  hasChanges={hasUnsavedChanges}
  loading={isSaving}
  disabled={isSaving}
  statusLabel={$t('common.unsaved_changes.label')}
  discardLabel={$t('common.discard')}
  saveLabel={$t('common.save_changes')}
  onSave={handleSave}
  onDiscard={handleDiscard}
/>
