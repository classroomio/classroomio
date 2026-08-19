<script lang="ts">
  import { cn } from '../../tools';
  import type { Snippet } from 'svelte';

  export interface AttentionHighlightProps {
    id?: string;
    highlight?: boolean;
    trigger?: number;
    duration?: number;
    autoScroll?: boolean;
    scrollBlock?: ScrollLogicalPosition;
    class?: string;
    onComplete?: () => void;
    children?: Snippet;
  }

  let {
    id,
    highlight = false,
    trigger = 0,
    duration = 3,
    autoScroll = true,
    scrollBlock = 'center',
    class: className = '',
    onComplete,
    children
  }: AttentionHighlightProps = $props();

  let containerRef = $state<HTMLDivElement | null>(null);
  let isPulsing = $state(false);
  let lastTrigger = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function scrollToElement() {
    if (!containerRef) return;
    containerRef.scrollIntoView({ behavior: 'smooth', block: scrollBlock });
  }

  function triggerPulse() {
    isPulsing = true;

    if (autoScroll) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToElement();
        });
      });
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      isPulsing = false;
      timeoutId = null;
      onComplete?.();
    }, duration * 1000);
  }

  $effect(() => {
    if (highlight) {
      triggerPulse();
    } else if (trigger === 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      isPulsing = false;
    }
  });

  $effect(() => {
    if (trigger !== lastTrigger) {
      lastTrigger = trigger;
      if (trigger > 0) {
        triggerPulse();
      }
    }
  });

  $effect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  });
</script>

<div
  {id}
  bind:this={containerRef}
  class={cn(
    'ui:rounded-md ui:transition-all',
    isPulsing && 'ui:border-primary ui:ring-primary/20 ui:animate-pulse ui:border ui:ring-4',
    className
  )}
>
  {#if children}
    {@render children()}
  {/if}
</div>
