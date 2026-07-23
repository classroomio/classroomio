<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    active?: boolean;
    duration?: number;
    children?: Snippet;
  }

  let { active = $bindable(false), duration = 3, children }: Props = $props();

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let containerRef = $state<HTMLDivElement | null>(null);

  function triggerHighlight() {
    if (timeoutId) clearTimeout(timeoutId);

    if (containerRef) {
      containerRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    timeoutId = setTimeout(() => {
      active = false;
    }, duration * 1000);
  }

  $effect(() => {
    if (active) {
      triggerHighlight();
    }
  });

  // after clearing, remove highlight from query parameter.

  // $effect(() => {
  //   return () => {
  //     if (timeoutId) clearTimeout(timeoutId);
  //   };
  // });
</script>

<div bind:this={containerRef} class="{active && 'ui:border-primary animate-pulse border'} rounded-md p-2">
  {#if children}
    {@render children()}
  {/if}
</div>
