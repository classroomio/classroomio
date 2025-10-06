<!--
  @component

  A Progress Bar that hooks to SvelteKit navigation.

  The progress bar will show during navigation if loading takes more than `displayThresholdMs`
  and will hide when navigation is complete.
  https://github.com/prgm-dev/sveltekit-progress-bar
-->

<script lang="ts">
  // import { run } from 'svelte/legacy';
  import { beforeNavigate } from '$app/navigation';

  // This component is a modified version of the component from the following repo:

  interface Props {
    // https://github.com/saibotsivad/svelte-progress-bar
    id?: string | undefined;
    viewTransitionName?: string;
    busy?: boolean;
    color?: string;
    textColorClass?: `text-${string}` | '';
    zIndex?: number;
    minimum?: number;
    maximum?: number;
    settleTime?: number;
    intervalTime?: number;
    stepSizes?: any;
    displayThresholdMs?: number;
    noNavigationProgress?: boolean;
  }

  let {
    id = undefined,
    viewTransitionName = 'sveltekit-progress-bar',
    busy = $bindable(false),
    color = 'currentColor',
    textColorClass = '',
    zIndex = 1,
    minimum = 0.08,
    maximum = 0.994,
    settleTime = 700,
    intervalTime = 700,
    stepSizes = [0, 0.005, 0.01, 0.02],
    displayThresholdMs = 150,
    noNavigationProgress = false
  }: Props = $props();

  // Towards the end of the progress bar animation, we want to shorten the increment
  // step size, to give it the appearance of slowing down. This indicates to the user
  // that progress is still happening, but not as fast as they might like.
  const getIncrement = (n: number) => {
    if (n >= 0 && n < 0.2) return 0.1;
    else if (n >= 0.2 && n < 0.5) return 0.04;
    else if (n >= 0.5 && n < 0.8) return 0.02;
    else if (n >= 0.8 && n < 0.99) return 0.005;
    return 0;
  };

  // Internal private state.
  let running = $state(false);
  let updater: ReturnType<typeof setInterval> | null = null;
  let completed = $state(false);
  let width = $state(0);

  // Update the busy prop when the internal `running` variable changes.
  // run(() => {
  //   busy = running;
  // });

  export const reset = (min = minimum) => {
    width = min;
    running = true;
  };

  /**
   * Continue the animation of the progress bar from whatever position it is in, using
   * a randomized step size to increment.
   */
  export const animate = () => {
    if (updater) {
      // prevent multiple intervals by clearing before making
      clearInterval(updater);
    }
    running = true;
    updater = setInterval(() => {
      const randomStep = stepSizes[Math.floor(Math.random() * stepSizes.length)] ?? 0;
      const step = getIncrement(width) + randomStep;
      if (width < maximum) {
        width = width + step;
      }
      if (width > maximum) {
        width = maximum;
        stop();
      }
    }, intervalTime);
  };

  /** Restart the bar at the minimum, and begin the auto-increment progress. */
  export const start = (min?: number) => {
    reset(min);
    animate();
  };

  /** Stop the progress bar from incrementing, but leave it visible. */
  export const stop = () => {
    if (updater) {
      clearInterval(updater);
    }
  };

  /**
   * Moves the progress bar to the fully completed position, wait an appropriate
   * amount of time so the user can feel the completion, then hide and reset.
   */
  export const complete = (settle = settleTime) => {
    if (updater) clearInterval(updater);
    if (!running) return;
    width = 1;
    running = false;
    setTimeout(() => {
      // complete the bar first
      completed = true;
      setTimeout(() => {
        // after some time (long enough to finish the hide animation) reset it back to 0
        completed = false;
        width = 0;
      }, settle);
    }, settle);
  };

  /** Stop the auto-increment functionality and manually set the width of the progress bar. */
  export const setWidthRatio = (widthRatio: typeof width) => {
    stop();
    width = widthRatio;
    completed = false;
    running = true;
  };

  // Primarily used for tests, but can also be used for external monitoring.
  export const getState = () => {
    return {
      width,
      running,
      completed,
      color,
      minimum,
      maximum,
      settleTime,
      intervalTime,
      stepSizes
    };
  };

  let barStyle = $derived(
    (color ? `background-color: ${color};` : '') +
      (width && width * 100 ? `width: ${width * 100}%;` : '') +
      `z-index: ${zIndex};` +
      `view-transition-name: ${viewTransitionName}-bar;`
  );

  // the box shadow of the leader bar uses `color` to set its shadow color
  let leaderColorStyle = $derived(
    (color ? `background-color: ${color}; color: ${color};` : '') +
      `z-index: ${zIndex + 1};` +
      `view-transition-name: ${viewTransitionName}-leader;`
  );

  let progressBarStartTimeout: ReturnType<typeof setTimeout> | null = null;

  beforeNavigate((nav) => {
    if (progressBarStartTimeout) {
      clearTimeout(progressBarStartTimeout);
      progressBarStartTimeout = null;
    }
    if (noNavigationProgress) return;

    if (nav.to?.route.id) {
      // Internal navigation.
      if (displayThresholdMs > 0) {
        // Schedule a display of the progress bar in `displayThresholdMs` milliseconds.
        // This is to avoid flickering/flashing when the navigation is fast.
        progressBarStartTimeout = setTimeout(
          () => !noNavigationProgress && start(),
          displayThresholdMs
        );
      } else start();

      nav.complete.catch().finally(() => {
        if (progressBarStartTimeout) {
          clearTimeout(progressBarStartTimeout);
          progressBarStartTimeout = null;
        }
        complete();
      });
    }
  });
</script>

{#if running || width > 0}
  <output
    {id}
    role="progressbar"
    aria-valuenow={width}
    aria-valuemin={0}
    aria-valuemax={1}
    class="svelte-progress-bar {textColorClass}"
    class:running
    class:svelte-progress-bar-hiding={completed}
    style={barStyle}
  >
    {#if running}
      <div class="svelte-progress-bar-leader" style={leaderColorStyle}></div>
    {/if}
  </output>
{/if}

<style>
  .svelte-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    transition: width 0.21s ease-in-out;
  }

  .svelte-progress-bar-hiding {
    transition: top 0.8s ease;
    top: -8px;
  }

  .svelte-progress-bar-leader {
    position: absolute;
    top: 0;
    right: 0;
    height: 5px;
    width: 100px;
    transform: rotate(2.5deg) translate(0px, -4px);
    box-shadow: 0 0 8px;
  }
</style>
