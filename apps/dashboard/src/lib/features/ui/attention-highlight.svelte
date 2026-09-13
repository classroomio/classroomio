<script lang="ts">
  import { afterNavigate, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { onMount, tick, type Snippet } from 'svelte';

  interface Props {
    id: string;
    duration?: number;
    trigger?: number;
    children?: Snippet;
  }

  let { id, duration = 5, trigger = 0, children }: Props = $props();

  let containerRef = $state<HTMLDivElement | null>(null);
  let pulsing = $state(false);
  let lastTrigger = trigger;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let retryTimeoutIds: ReturnType<typeof setTimeout>[] = [];

  function getActiveHighlightId(url: URL): string | null {
    const query = url.searchParams.get('highlight');
    if (query) return query;

    const hash = url.hash.replace('#', '').trim();
    return hash || null;
  }

  function clearScrollRetries() {
    for (const retryTimeoutId of retryTimeoutIds) {
      clearTimeout(retryTimeoutId);
    }

    retryTimeoutIds = [];
  }

  function clearTimers() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    clearScrollRetries();
  }

  function scrollToSection() {
    containerRef?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function triggerPulse() {
    pulsing = true;
    scrollToSection();

    void tick().then(() => {
      scrollToSection();
      clearScrollRetries();
      retryTimeoutIds = [50, 300].map((delayMs) => setTimeout(scrollToSection, delayMs));
    });

    if (timeoutId) clearTimeout(timeoutId);

    const pulseMs = (Number(duration) || 5) * 1000;
    timeoutId = setTimeout(() => {
      pulsing = false;
      timeoutId = null;
      clearScrollRetries();

      const url = new URL(page.url);
      const highlightActive = url.searchParams.get('highlight') === id;
      const hashActive = url.hash.replace('#', '').trim() === id;

      if (highlightActive) url.searchParams.delete('highlight');
      if (hashActive) url.hash = '';

      if (highlightActive || hashActive) {
        replaceState(resolve(`${url.pathname}${url.search}`, {}), page.state);
      }
    }, pulseMs);
  }

  function pulseIfUrlMatches() {
    if (getActiveHighlightId(page.url) !== id) return;

    if (pulsing) {
      scrollToSection();
      return;
    }

    triggerPulse();
  }

  onMount(() => {
    pulseIfUrlMatches();

    return () => {
      clearTimers();
    };
  });

  afterNavigate(() => {
    pulseIfUrlMatches();
  });

  $effect(() => {
    if (trigger === lastTrigger) return;

    lastTrigger = trigger;

    if (trigger > 0) {
      triggerPulse();
    }
  });
</script>

<div
  bind:this={containerRef}
  class={`scroll-mt-16 rounded-md p-2 ${pulsing ? 'ui:bg-primary/15 ui:ring-primary ui:ring-4 ui:ring-offset-background ui:ring-offset-2' : ''}`}
>
  {#if children}
    {@render children()}
  {/if}
</div>
