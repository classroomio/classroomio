<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../../tools';

  interface Props {
    viewBox: string;
    label?: string;
    stillAt?: number;
    class?: string;
    children: Snippet;
  }

  let { viewBox, label, stillAt = 6, class: className, children }: Props = $props();

  let svg: SVGSVGElement | undefined = $state();

  $effect(() => {
    if (!svg) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPlayback = () => {
      if (!svg) return;

      if (reducedMotion.matches) {
        svg.setCurrentTime(stillAt);
        svg.pauseAnimations();

        return;
      }

      svg.unpauseAnimations();
    };

    syncPlayback();
    reducedMotion.addEventListener('change', syncPlayback);

    return () => reducedMotion.removeEventListener('change', syncPlayback);
  });
</script>

<svg
  bind:this={svg}
  xmlns="http://www.w3.org/2000/svg"
  {viewBox}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  class={cn('machine ui:pointer-events-none ui:block ui:h-full ui:w-full', className)}
>
  {@render children()}
</svg>

<style>
  .machine {
    --hl-ink: var(--machine-ink, var(--primary));
    --hl-face: var(--machine-face, var(--muted));
    --hl-line: color-mix(in srgb, var(--foreground) 38%, var(--hl-face));
    --hl-line2: color-mix(in srgb, var(--foreground) 14%, var(--hl-face));
    --hl-text: color-mix(in srgb, var(--foreground) 50%, var(--hl-face));
  }

  .machine :global(*) {
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .machine :global(.ln) {
    fill: var(--hl-face);
    stroke: var(--hl-line);
    stroke-width: 1.1;
  }

  .machine :global(.lo) {
    fill: none;
    stroke: var(--hl-line);
    stroke-width: 1.1;
  }

  .machine :global(.lt) {
    fill: none;
    stroke: var(--hl-line2);
    stroke-width: 1;
  }

  .machine :global(.dash) {
    stroke-dasharray: 3 4;
    stroke: var(--hl-line);
  }

  .machine :global(.fl) {
    fill: var(--hl-face);
    stroke: none;
  }

  .machine :global(.ink) {
    fill: var(--hl-face);
    stroke: var(--hl-ink);
    stroke-width: 1.5;
  }

  .machine :global(.ko) {
    fill: none;
    stroke: var(--hl-ink);
    stroke-width: 1.5;
  }

  .machine :global(.kf) {
    fill: var(--hl-ink);
    stroke: none;
  }

  .machine :global(.dot) {
    fill: var(--hl-line);
    stroke: none;
  }

  .machine :global(.bar) {
    stroke: var(--hl-line);
    stroke-width: 2.4;
  }

  .machine :global(text) {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 8.5px;
    letter-spacing: 0.03em;
    stroke: none;
  }

  .machine :global(.tx) {
    fill: var(--hl-text);
  }

  .machine :global(.tk) {
    fill: var(--hl-ink);
  }
</style>
