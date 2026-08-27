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
    duration = 2.5,
    autoScroll = true,
    scrollBlock = 'center',
    class: className = '',
    onComplete,
    children
  }: AttentionHighlightProps = $props();

  let containerRef = $state<HTMLDivElement | null>(null);
  let isPulsing = $state(false);
  let lastSeenTrigger = $state(0);
  let hasHandledHighlight = $state(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let scrollTimeoutId: ReturnType<typeof setTimeout> | null = null;

  function scrollToElement() {
    if (!containerRef) return;
    containerRef.scrollIntoView({ behavior: 'smooth', block: scrollBlock });
  }

  function triggerPulse() {
    isPulsing = true;

    if (autoScroll) {
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }
      scrollTimeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToElement();
          scrollTimeoutId = null;
        });
      }, 100);
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
    if (highlight && !hasHandledHighlight) {
      hasHandledHighlight = true;
      triggerPulse();
    } else if (!highlight) {
      hasHandledHighlight = false;
    }
  });

  $effect(() => {
    if (trigger > 0 && trigger !== lastSeenTrigger) {
      lastSeenTrigger = trigger;
      triggerPulse();
    }
  });

  $effect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
        scrollTimeoutId = null;
      }
    };
  });
</script>

<div {id} bind:this={containerRef} class={cn('ui:relative ui:rounded-md', className)}>
  {#if isPulsing}
    <div
      class="ui:pointer-events-none ui:absolute ui:inset-0 ui:animate-pulse ui:rounded-[inherit] ui:border ui:border-primary ui:ring-4 ui:ring-primary/20"
      aria-hidden="true"
    ></div>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</div>
