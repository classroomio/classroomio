<script lang="ts">
  import { onDestroy } from 'svelte';
  import { OrgPage } from '$features/settings/pages';
  import { settingsHeaderAction } from '$features/settings/utils/store';

  let orgComponent: OrgPage | null = $state(null);
  let loading = $state(false);

  async function handleUpdate() {
    loading = true;
    try {
      await orgComponent?.handleUpdate();
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    settingsHeaderAction.set({
      label: 'Save',
      disabled: loading,
      loading,
      onClick: handleUpdate
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
  <title>Organization Settings - ClassroomIO</title>
</svelte:head>

<OrgPage bind:this={orgComponent} />
