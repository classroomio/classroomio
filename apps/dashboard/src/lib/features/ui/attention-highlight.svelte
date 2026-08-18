<script lang="ts">
  import { afterNavigate, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { tick, untrack, type Snippet } from 'svelte';

  interface Props {
    id: string;
    duration?: number;
    trigger?: number;
    children?: Snippet;
  }

  let { id, duration = 3, trigger = 0, children }: Props = $props();

  const SCROLL_RETRY_DELAYS_MS = [0, 50, 300];

  let containerRef = $state<HTMLDivElement | null>(null);
  let pulsing = $state(false);
  let handledFor = $state<string | null>(null);
  let lastTrigger = trigger;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let retryTimeoutIds: ReturnType<typeof setTimeout>[] = [];
  let rafId: number | null = null;

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

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
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

  function scheduleScrollRetries() {
    clearScrollRetries();

    rafId = requestAnimationFrame(() => {
      scrollToSection();
      rafId = null;
    });

    retryTimeoutIds = SCROLL_RETRY_DELAYS_MS.map((delayMs) =>
      setTimeout(() => {
        scrollToSection();
      }, delayMs)
    );
  }

  async function triggerPulse() {
    pulsing = true;
    scheduleScrollRetries();

    await tick();
    scrollToSection();

    if (timeoutId) clearTimeout(timeoutId);
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
    }, duration * 1000);
  }

  function maybePulseFromUrl(resyncScroll = false) {
    const href = page.url.href;
    const activeHighlightId = getActiveHighlightId(page.url);

    if (activeHighlightId !== id) {
      untrack(() => {
        handledFor = null;
      });
      return;
    }

    if (untrack(() => handledFor) === href) {
      if (resyncScroll) {
        scheduleScrollRetries();
      }

      return;
    }

    untrack(() => {
      handledFor = href;
    });
    void triggerPulse();
  }

  $effect(() => {
    void page.url.href;
    maybePulseFromUrl();
  });

  afterNavigate(() => {
    maybePulseFromUrl(true);
  });

  $effect(() => {
    if (trigger === lastTrigger) return;

    lastTrigger = trigger;

    if (trigger > 0) {
      void triggerPulse();
    }
  });

  $effect(() => {
    return () => {
      clearTimers();
    };
  });
</script>

<div
  bind:this={containerRef}
  class={`scroll-mt-16 rounded-md p-2 ${pulsing ? 'ui:ring-primary ui:ring-2 ui:ring-offset-2 animate-pulse' : ''}`}
>
  {#if children}
    {@render children()}
  {/if}
</div>
