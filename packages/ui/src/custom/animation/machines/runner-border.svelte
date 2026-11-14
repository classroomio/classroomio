<script lang="ts">
  import type { RunnerSnapshot } from './types';

  const PATH_LENGTH = 1000;
  const LAP_POINTS = 30;
  const DASH_LENGTH = 7;
  const DASH_GAP = 6;
  const STROKE_WIDTH = 1.5;
  const CORNER_RADIUS = 10;
  const START_MARCH_SECONDS = 1.6;
  const FASTEST_MARCH_SECONDS = 0.45;
  const MARCH_SECONDS_SAVED_PER_POINT = 0.05;

  let { snapshot }: { snapshot: RunnerSnapshot } = $props();

  const maskId = `runner-border-${Math.random().toString(36).slice(2)}`;
  let width = $state(0);
  let height = $state(0);

  const isRecord = $derived(snapshot.status === 'over' && snapshot.isNewRecord);
  const isCrashed = $derived(snapshot.status === 'over' && !snapshot.isNewRecord);
  const isMarching = $derived(snapshot.status === 'running');
  const lapCount = $derived(Math.floor(snapshot.passed / LAP_POINTS));
  const litLength = $derived(isRecord ? PATH_LENGTH : ((snapshot.passed % LAP_POINTS) / LAP_POINTS) * PATH_LENGTH);
  const marchSeconds = $derived(
    Math.max(FASTEST_MARCH_SECONDS, START_MARCH_SECONDS - snapshot.passed * MARCH_SECONDS_SAVED_PER_POINT)
  );
  const tone = $derived(isRecord ? 'record' : isCrashed ? 'crash' : 'live');
  const geometry = $derived({
    x: STROKE_WIDTH / 2,
    y: STROKE_WIDTH / 2,
    width: Math.max(width - STROKE_WIDTH, 0),
    height: Math.max(height - STROKE_WIDTH, 0),
    rx: CORNER_RADIUS,
    fill: 'none'
  });
  const dashPattern = `${DASH_LENGTH} ${DASH_GAP}`;
</script>

<div class="runner-border" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width > 0}
    <svg
      {width}
      {height}
      viewBox="0 0 {width} {height}"
      data-tone={tone}
      data-marching={isMarching}
      style:--march-seconds="{marchSeconds}s"
      style:--march-distance="-{DASH_LENGTH + DASH_GAP}"
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <rect
            {...geometry}
            pathLength={PATH_LENGTH}
            stroke="white"
            stroke-width={STROKE_WIDTH * 6}
            stroke-dasharray="{litLength} {PATH_LENGTH}"
          ></rect>
        </mask>
      </defs>

      <rect class="base" {...geometry} stroke-width={STROKE_WIDTH} stroke-dasharray={dashPattern}></rect>

      <g mask="url(#{maskId})">
        <rect class="lit" {...geometry} stroke-width={STROKE_WIDTH} stroke-dasharray={dashPattern}></rect>
      </g>

      {#key lapCount}
        {#if lapCount > 0}
          <rect class="lap-flash" {...geometry} stroke-width={STROKE_WIDTH * 2}></rect>
        {/if}
      {/key}
    </svg>
  {/if}
</div>

<style>
  .runner-border {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  svg {
    display: block;
    --tone: var(--primary);
    overflow: visible;
  }

  svg[data-tone='crash'] {
    --tone: var(--destructive);
  }

  svg[data-tone='record'] {
    --tone: #16a34a;
  }

  .base {
    stroke: var(--border);
  }

  .lit {
    stroke: var(--tone);
  }

  svg[data-marching='true'] .base,
  svg[data-marching='true'] .lit {
    animation: march var(--march-seconds) linear infinite;
  }

  svg[data-tone='crash'] .lit {
    animation: scatter 1.1s ease-out forwards;
  }

  svg[data-tone='record'] .lit {
    animation: glow 1.2s ease-in-out infinite;
  }

  .lap-flash {
    stroke: var(--primary);
    opacity: 0;
    animation: lap-flash 0.8s ease-out;
  }

  @keyframes march {
    to {
      stroke-dashoffset: var(--march-distance);
    }
  }

  @keyframes scatter {
    0% {
      opacity: 1;
    }
    18% {
      opacity: 0.15;
    }
    34% {
      opacity: 1;
    }
    52% {
      opacity: 0.15;
    }
    100% {
      opacity: 0;
      stroke-dashoffset: 140;
    }
  }

  @keyframes glow {
    0%,
    100% {
      filter: drop-shadow(0 0 1px #16a34a);
    }
    50% {
      filter: drop-shadow(0 0 5px #4ade80);
    }
  }

  @keyframes lap-flash {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    svg .base,
    svg .lit,
    svg .lap-flash {
      animation: none;
    }
  }
</style>
