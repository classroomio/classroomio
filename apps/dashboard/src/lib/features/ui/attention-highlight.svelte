<script lang="ts">
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    duration?: number;
    children?: Snippet;
  }

  let { id, duration = 3, children }: Props = $props();

  let containerRef = $state<HTMLDivElement | null>(null);
  let pulsing = $state(false);
  let handledFor = $state<string | null>(null);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const highlightParam = page.url.searchParams.get('highlight');

    if (highlightParam !== id) return;
    if (handledFor === highlightParam) return;

    handledFor = highlightParam;
    pulsing = true;

    containerRef?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      pulsing = false;
      timeoutId = null;

      const url = new URL(page.url);
      if (url.searchParams.get('highlight') === id) {
        url.searchParams.delete('highlight');
        replaceState(url, page.state);
      }
    }, duration * 1000);
  });

  $effect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
</script>

<div bind:this={containerRef} class={`rounded-md p-2 ${pulsing ? 'ui:border-primary animate-pulse border' : ''}`}>
  {#if children}{@render children()}{/if}
</div>
