<script lang="ts">
  import { onDestroy } from 'svelte';
  import { CustomizeLmsPage } from '$features/settings/pages';
  import { settingsHeaderAction } from '$features/settings/utils/store';

  let customizeLmsComponent: CustomizeLmsPage | null = $state(null);
  let isSaving = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      await customizeLmsComponent?.handleSave();
    } finally {
      isSaving = false;
    }
  }

  $effect(() => {
    settingsHeaderAction.set({
      label: 'Save',
      disabled: isSaving,
      loading: isSaving,
      onClick: handleSave
    });
  });

  onDestroy(() => {
    settingsHeaderAction.set({
      label: 'Save',
      disabled: true,
      loading: false,
      onClick: null
    });
  });
</script>

<svelte:head>
  <title>Customize LMS - ClassroomIO</title>
</svelte:head>

<CustomizeLmsPage bind:this={customizeLmsComponent} />
