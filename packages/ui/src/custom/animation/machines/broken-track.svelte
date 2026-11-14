<script lang="ts">
  import type { Component } from 'svelte';
  import MachineFrame from './machine-frame.svelte';
  import type { BrokenTrackProps, RunnerProps } from './types';

  let {
    label,
    stillAt = 3.9,
    playable = true,
    startLabel = 'PRESS SPACE TO PLAY',
    class: className,
    ...runnerLabels
  }: BrokenTrackProps = $props();

  let Runner: Component<RunnerProps> | undefined = $state();
  let isLoading = false;
  let hostWidth = $state(0);
  let baseWidth = $state(0);

  async function startGame() {
    if (!playable || Runner || isLoading) return;

    isLoading = true;
    baseWidth = hostWidth;

    try {
      const module = await import('./track-runner.svelte');
      Runner = module.default;
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!playable || Runner) return;
    if (event.code !== 'Space' && event.code !== 'ArrowUp') return;

    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;

    event.preventDefault();
    if (event.repeat) return;

    void startGame();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if Runner}
  <Runner {label} {startLabel} {...runnerLabels} autoStart baseWidth={baseWidth || undefined} class={className} />
{:else}
  <div
    class="ui:h-full ui:w-full {playable ? 'ui:cursor-pointer ui:touch-manipulation ui:select-none' : ''}"
    role="presentation"
    bind:clientWidth={hostWidth}
    onpointerdown={startGame}
  >
    <MachineFrame viewBox="-96 -29 339 222" {label} {stillAt} class={className}>
      <polygon class="ln" points="-77.9,45.0 147.2,175.0 147.2,167.0 -77.9,37.0"></polygon><polygon
        class="ln"
        points="225.2,130.0 147.2,175.0 147.2,167.0 225.2,122.0"
      ></polygon><polygon class="ln" points="0.0,-8.0 225.2,122.0 147.2,167.0 -77.9,37.0"></polygon><polyline
        class="lo"
        points="110.9,58.0 94.4,61.5 94.4,73.5 74.5,75.0 72.7,87.0 52.8,88.5 48.5,98.0 33.8,101.5"
      ></polyline><polygon class="ln" points="-48.5,20.0 -36.4,27.0 -36.4,7.0 -48.5,0.0"></polygon><polygon
        class="ln"
        points="-17.3,16.0 -36.4,27.0 -36.4,7.0 -17.3,-4.0"
      ></polygon><polygon class="ln" points="-29.4,-11.0 -17.3,-4.0 -36.4,7.0 -48.5,0.0"></polygon><polygon
        class="ln"
        points="164.5,143.0 176.7,150.0 176.7,130.0 164.5,123.0"
      ></polygon><polygon class="ln" points="195.7,139.0 176.7,150.0 176.7,130.0 195.7,119.0"></polygon><polygon
        class="ln"
        points="183.6,112.0 195.7,119.0 176.7,130.0 164.5,123.0"
      ></polygon><polygon class="ln" points="-31.2,24.0 47.6,69.5 47.6,63.5 -31.2,18.0"></polygon><polygon
        class="ln"
        points="56.3,64.5 47.6,69.5 47.6,63.5 56.3,58.5"
      ></polygon><polygon class="ln" points="-22.5,13.0 56.3,58.5 47.6,63.5 -31.2,18.0"></polygon><polygon
        class="lt dash"
        points="56.3,58.5 99.6,83.5 90.9,88.5 47.6,63.5"
      ></polygon><polygon class="ln" points="90.9,94.5 169.7,140.0 169.7,134.0 90.9,88.5"></polygon><polygon
        class="ln"
        points="178.4,135.0 169.7,140.0 169.7,134.0 178.4,129.0"
      ></polygon><polygon class="ln" points="99.6,83.5 178.4,129.0 169.7,134.0 90.9,88.5"></polygon><polygon
        class="ln"
        points="46.8,101.0 53.7,105.0 53.7,83.0 46.8,79.0"
      ></polygon><polygon class="ln" points="60.6,101.0 53.7,105.0 53.7,83.0 60.6,79.0"></polygon><polygon
        class="ln"
        points="53.7,75.0 60.6,79.0 53.7,83.0 46.8,79.0"
      ></polygon><polygon class="kf" points="53.7,75.0 60.6,79.0 53.7,83.0 46.8,79.0"
        ><animate
          attributeName="opacity"
          values="0.15;0.15;1;0.15;1;0.15;1;0.15;0.15"
          keyTimes="0;0.36;0.4;0.44;0.48;0.52;0.56;0.6;1"
          dur="8s"
          repeatCount="indefinite"
        ></animate></polygon
      ><g
        ><animateTransform
          attributeName="transform"
          type="translate"
          values="0.0,0.0;0.0,0.0;53.7,31.0;60.6,35.0;60.6,35.0;52.0,30.0;0.0,0.0;0.0,0.0"
          keyTimes="0;0.0625;0.35;0.4;0.5375;0.5875;0.825;1"
          calcMode="spline"
          keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
          dur="8s"
          repeatCount="indefinite"
        ></animateTransform><g
          ><animateTransform
            attributeName="transform"
            type="rotate"
            values="0 -8.7 26.0;0 -8.7 26.0;12 -8.7 26.0;12 -8.7 26.0;-1.5 -8.7 26.0;0 -8.7 26.0;0 -8.7 26.0"
            keyTimes="0;0.4;0.4437;0.5375;0.5813;0.6125;1"
            calcMode="spline"
            keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
            dur="8s"
            repeatCount="indefinite"
          ></animateTransform><polygon class="ink" points="-26.8,25.5 -9.5,35.5 -9.5,17.5 -26.8,7.5"></polygon><polygon
            class="ink"
            points="7.8,25.5 -9.5,35.5 -9.5,17.5 7.8,7.5"
          ></polygon><polygon class="kf" points="-9.5,-2.5 7.8,7.5 -9.5,17.5 -26.8,7.5"></polygon></g
        ></g
      >
      {#if playable}
        <text class="tk" x="73" y="-8" text-anchor="middle">
          {startLabel}
          <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite"></animate>
        </text>
      {/if}
    </MachineFrame>
  </div>
{/if}
