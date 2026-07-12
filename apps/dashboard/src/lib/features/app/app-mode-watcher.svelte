<script lang="ts">
  import { onMount } from 'svelte';

  import { initColorModeState } from '$lib/utils/functions/color-mode.svelte.ts';

  onMount(() => {
    initColorModeState();
  });
</script>
