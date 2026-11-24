<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Width the theme renders at before the canvas is scaled down. */
    canvasWidth?: number;
    /** Height as a fraction of `canvasWidth`. */
    aspectRatio?: number;
    class?: string;
    children: Snippet;
  }

  let { canvasWidth = 1440, aspectRatio = 0.625, class: className = '', children }: Props = $props();

  let containerWidth = $state(0);

  const scale = $derived(containerWidth > 0 ? containerWidth / canvasWidth : 0.5);
</script>

<div
  class="ui:border-border ui:bg-background relative w-full overflow-hidden rounded-xl border select-none {className}"
  style:aspect-ratio={String(1 / aspectRatio)}
  bind:clientWidth={containerWidth}
>
  <div
    class="pointer-events-none absolute top-0 left-0 origin-top-left"
    style="width: {canvasWidth}px; height: {canvasWidth * aspectRatio}px; transform: scale({scale});"
  >
    {@render children()}
  </div>
</div>
