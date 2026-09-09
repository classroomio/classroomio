<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    timestampLabel?: string;
    durationLabel?: string;
    progressPercent?: number;
    markerPercents?: number[];
    children?: Snippet;
    class?: string;
  }

  let {
    timestampLabel = '0:45',
    durationLabel = '6:12',
    progressPercent = 12,
    markerPercents = [12, 36],
    children,
    class: className = ''
  }: Props = $props();

  const clampedProgress = $derived(Math.min(100, Math.max(0, progressPercent)));
</script>

<div class="relative aspect-video w-full overflow-hidden rounded-md bg-zinc-950 {className}">
  <div class="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-950 to-black">
    <p class="absolute top-4 left-4 text-xs font-medium tracking-wide text-white/70">
      Paused at {timestampLabel}
    </p>
  </div>

  {@render children?.()}

  <div class="pointer-events-none absolute right-0 bottom-0 left-0 z-10 px-4 pb-3">
    <div class="relative mb-1.5 h-1 rounded-full bg-white/25">
      <div class="absolute inset-y-0 left-0 rounded-full bg-white" style:width="{clampedProgress}%"></div>
      {#each markerPercents as markerPercent (markerPercent)}
        <span
          class="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400"
          style:left="{Math.min(100, Math.max(0, markerPercent))}%"
        ></span>
      {/each}
    </div>
    <p class="text-[11px] text-white/70">{timestampLabel} / {durationLabel}</p>
  </div>
</div>
