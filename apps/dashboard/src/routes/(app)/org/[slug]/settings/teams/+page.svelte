<script>
  import { onDestroy } from 'svelte';
  import { TeamsPage } from '$features/settings/pages';
  import { settingsHeaderAction } from '$features/settings/utils/store';

  $effect(() => {
    settingsHeaderAction.set({
      label: 'Save',
      disabled: true,
      loading: false,
      onClick: null
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
  <title>Teams - ClassroomIO</title>
</svelte:head>

<TeamsPage />
