<script lang="ts">
  import { onMount } from 'svelte';
  import { sideBar } from '$lib/components/Org/store';
  import { apps } from '$lib/components/Apps/store';
  import APPS_CONSTANTS from '$lib/components/Apps/constants';
  import hotkeys from 'hotkeys-js';

  function handleClose() {
    $apps.selectedApp = undefined;
    if ($apps.isStudent) {
      $apps.open = false;
    }
  }

  function handleAppClick(appName?: string) {
    if (appName === $apps.selectedApp) {
      handleClose();
    } else {
      $apps.selectedApp = appName;
    }
    $apps.open = true;
    $apps.dropdown = !$apps.dropdown;
  }

  function toggleSidebar() {
    $sideBar.hidden = !$sideBar.hidden;
  }

  onMount(() => {
    hotkeys('ctrl+b,command+b,ctrl+1,command+1,ctrl+2,command+2', function (event, handler) {
      // Prevent default behavior
      event.preventDefault();

      console.log({ handlerKey: handler.key });

      switch (handler.key) {
        case 'ctrl+b':
        case 'command+b':
          toggleSidebar();
          break;
        case 'ctrl+1':
        case 'command+1':
          handleAppClick(APPS_CONSTANTS.APPS.COMMENTS);
          break;
        case 'ctrl+2':
        case 'command+2':
          handleAppClick(APPS_CONSTANTS.APPS.POLL);
          break;
      }
    });
  });
</script>

<slot />
