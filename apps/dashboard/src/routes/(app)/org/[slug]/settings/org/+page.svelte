<script lang="ts">
  import { OrgPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';

  let orgComponent: OrgPage | null = $state(null);
  let loading = $state(false);
  let hasUnsavedChanges = $state(false);

  async function handleUpdate() {
    loading = true;
    try {
      await orgComponent?.handleUpdate();
    } finally {
      loading = false;
    }
  }

  function handleDiscard() {
    orgComponent?.handleDiscard();
  }
</script>

<svelte:head>
  <title>Organization Settings - ClassroomIO</title>
</svelte:head>

<OrgPage bind:this={orgComponent} bind:hasUnsavedChanges />
<Page.SettingsActions
  hasChanges={hasUnsavedChanges}
  {loading}
  statusLabel={$t('common.unsaved_changes.label')}
  discardLabel={$t('common.discard')}
  saveLabel={$t('common.save_changes')}
  onSave={handleUpdate}
  onDiscard={handleDiscard}
/>
