<script lang="ts">
  import { onMount } from 'svelte';
  import { sideBar } from '$lib/components/Org/store';
  import hotkeys from 'hotkeys-js';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  function toggleSidebar() {
    $sideBar.hidden = !$sideBar.hidden;
  }

  onMount(() => {
    hotkeys('ctrl+b,command+b', function (event, handler) {
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

{@render children?.()}
