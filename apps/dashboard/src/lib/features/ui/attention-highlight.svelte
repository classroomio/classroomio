<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    highlightedField?: string | null;
    duration?: number;
    children?: Snippet;
  }

  let { id, highlightedField = $bindable<string | null>(null), duration = 3, children }: Props = $props();

  let containerRef = $state<HTMLDivElement | null>(null);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const active = $derived(highlightedField === id);

  $effect(() => {
    if (!active) return;

    containerRef?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      highlightedField = null;
    }, duration * 1000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
</script>

<div
  bind:this={containerRef}
  class:ui\:border-primary={active}
  class:border={active}
  class:animate-pulse={active}
  class="rounded-md p-2 transition-all"
>
  {@render children?.()}
</div>
