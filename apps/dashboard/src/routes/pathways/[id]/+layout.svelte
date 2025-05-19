<script>
  import hotkeys from 'hotkeys-js';
  import { onMount } from 'svelte';

  import { sideBar } from '$lib/components/Org/store';

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
      }
    });
  });
</script>

<slot />
