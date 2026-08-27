<script module lang="ts">
  import { writable } from 'svelte/store';

  export const activeHighlightTrigger = writable<{ id: string; count: number }>({ id: '', count: 0 });

  let triggerCounter = 0;

  export function triggerAttentionHighlight(id: string) {
    triggerCounter += 1;
    activeHighlightTrigger.set({ id, count: triggerCounter });
  }
</script>

<script lang="ts">
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import AttentionHighlight from '@cio/ui/custom/attention-highlight';
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    duration?: number;
    trigger?: number;
    autoScroll?: boolean;
    scrollBlock?: ScrollLogicalPosition;
    class?: string;
    children?: Snippet;
  }

  let {
    id,
    duration = 3,
    trigger = 0,
    autoScroll = true,
    scrollBlock = 'center',
    class: className = '',
    children
  }: Props = $props();

  let localTrigger = $state(0);
  let hasHandledUrlHighlight = $state(false);

  function getActiveHighlightId(url: URL): string | null {
    const query = url.searchParams.get('highlight');
    if (query) return query;

    const hash = url.hash.replace('#', '').trim();
    return hash || null;
  }

  let activeHighlightId = $derived(getActiveHighlightId(page.url));
  let isTarget = $derived(activeHighlightId === id && !hasHandledUrlHighlight);

  $effect(() => {
    if (activeHighlightId === id) {
      hasHandledUrlHighlight = false;
    }
  });

  $effect(() => {
    const current = $activeHighlightTrigger;
    if (current && current.id === id && current.count > 0) {
      localTrigger = current.count;
    }
  });

  const effectiveTrigger = $derived(trigger + localTrigger);

  function handleComplete() {
    hasHandledUrlHighlight = true;

    if (typeof window !== 'undefined') {
      const url = new URL(page.url);
      const highlightActive = url.searchParams.get('highlight') === id;
      const hashActive = url.hash.replace('#', '').trim() === id;

      if (highlightActive) url.searchParams.delete('highlight');
      if (hashActive) url.hash = '';

      if (highlightActive || hashActive) {
        replaceState(resolve(`${url.pathname}${url.search}${url.hash}`, {}), page.state);
      }
    }
  }
</script>

<AttentionHighlight
  {id}
  highlight={isTarget}
  trigger={effectiveTrigger}
  {duration}
  {autoScroll}
  {scrollBlock}
  class={className}
  onComplete={handleComplete}
>
  {#if children}
    {@render children()}
  {/if}
</AttentionHighlight>
