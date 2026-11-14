<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import type { RunnerSnapshot } from './types';

  let { snapshot }: { snapshot: RunnerSnapshot } = $props();

  let Border: Component<{ snapshot: RunnerSnapshot }> | undefined = $state();

  onMount(async () => {
    const module = await import('./runner-border.svelte');
    Border = module.default;
  });
</script>

{#if Border}
  <Border {snapshot} />
{/if}
