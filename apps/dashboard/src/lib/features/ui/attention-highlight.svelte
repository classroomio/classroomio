<script lang="ts">
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
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

  function getActiveHighlightId(url: URL): string | null {
    const query = url.searchParams.get('highlight');
    if (query) return query;

    const hash = url.hash.replace('#', '').trim();
    return hash || null;
  }

  let activeHighlightId = $derived(getActiveHighlightId(page.url));
  let isTarget = $derived(activeHighlightId === id);

  function handleComplete() {
    const url = new URL(page.url);
    const highlightActive = url.searchParams.get('highlight') === id;
    const hashActive = url.hash.replace('#', '').trim() === id;

    if (highlightActive) url.searchParams.delete('highlight');
    if (hashActive) url.hash = '';

    if (highlightActive || hashActive) {
      replaceState(resolve(`${url.pathname}${url.search}`, {}), page.state);
    }
  }
</script>

<AttentionHighlight
  {id}
  highlight={isTarget}
  {trigger}
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
