<script lang="ts">
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    duration?: number;
    trigger?: number;
    children?: Snippet;
  }

  let { id, duration = 3, trigger = 0, children }: Props = $props();

  let containerRef = $state<HTMLDivElement | null>(null);
  let pulsing = $state(false);
  let handledFor = $state<string | null>(null);
  let lastTrigger = trigger;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function getActiveHighlightId(url: URL): string | null {
    const query = url.searchParams.get('highlight');
    if (query) return query;

    const hash = url.hash.replace('#', '').trim();
    return hash || null;
  }

  function triggerPulse() {
    pulsing = true;

    containerRef?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      pulsing = false;
      timeoutId = null;

      const url = new URL(page.url);
      const highlightActive = url.searchParams.get('highlight') === id;
      const hashActive = url.hash.replace('#', '').trim() === id;

      if (highlightActive) url.searchParams.delete('highlight');
      if (hashActive) url.hash = '';

      if (highlightActive || hashActive) {
        replaceState(resolve(`${url.pathname}${url.search}`, {}), page.state);
      }
    }, duration * 1000);
  }

  $effect(() => {
    const activeHighlightId = getActiveHighlightId(page.url);

    if (activeHighlightId !== id) {
      handledFor = null;
      return;
    }

    if (handledFor === activeHighlightId) return;

    handledFor = activeHighlightId;
    triggerPulse();
  });

  $effect(() => {
    if (trigger === lastTrigger) return;

    lastTrigger = trigger;

    if (trigger > 0) {
      triggerPulse();
    }
  });

  $effect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
</script>

<div bind:this={containerRef} class={`rounded-md p-2 ${pulsing ? 'ui:border-primary animate-pulse border' : ''}`}>
  {#if children}
    {@render children()}
  {/if}
</div>
