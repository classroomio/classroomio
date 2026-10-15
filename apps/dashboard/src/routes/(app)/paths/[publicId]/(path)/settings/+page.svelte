<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { PathSettings } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import { UnsavedChanges } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  let settingsComponent: ReturnType<typeof PathSettings> | null = $state(null);
  let isSaving = $state(false);
  let hasUnsavedChanges = $state(false);

  const activePath = $derived(learningPathApi.currentPath);

  async function handleSave() {
    isSaving = true;

    try {
      await settingsComponent?.handleSave();
    } finally {
      isSaving = false;
    }
  }

  function handleDiscard() {
    settingsComponent?.handleDiscard();
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('learningPath.settings.title')}
      </Page.Title>
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if activePath}
        <PathSettings bind:this={settingsComponent} path={activePath} bind:hasUnsavedChanges />
      {/if}
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
</Page.Root>
