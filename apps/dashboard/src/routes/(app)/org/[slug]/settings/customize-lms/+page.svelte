<script lang="ts">
  import { CustomizeLmsPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';

  let customizeLmsComponent: CustomizeLmsPage | null = $state(null);
  let isSaving = $state(false);
  let hasUnsavedChanges = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      await customizeLmsComponent?.handleSave();
    } finally {
      isSaving = false;
    }
  }

  function handleDiscard() {
    customizeLmsComponent?.handleDiscard();
  }
</script>

<svelte:head>
  <title>Customize LMS - ClassroomIO</title>
</svelte:head>

<CustomizeLmsPage bind:this={customizeLmsComponent} bind:hasUnsavedChanges />
<Page.SettingsActions
  hasChanges={hasUnsavedChanges}
  loading={isSaving}
  statusLabel={$t('common.unsaved_changes.label')}
  discardLabel={$t('common.discard')}
  saveLabel={$t('common.save_changes')}
  onSave={handleSave}
  onDiscard={handleDiscard}
/>
