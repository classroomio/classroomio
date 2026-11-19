<script lang="ts">
  import { onDestroy } from 'svelte';

  interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    animate?: boolean;
    ariaHidden?: boolean;
    class?: string;
  }

  let {
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    animate: animateProp = false,
    ariaHidden = false,
    class: className = ''
  }: IconProps = $props();

  let hoverAnimate = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  const animate = $derived(animateProp || hoverAnimate);

  function handleMouseEnter() {
    if (animate) return;

    hoverAnimate = true;
    resetTimer = setTimeout(() => {
      hoverAnimate = false;
    }, 200);
  }

  onDestroy(() => clearTimeout(resetTimer));
</script>

<div
  class={className}
  aria-hidden={ariaHidden ? true : undefined}
  aria-label={ariaHidden ? undefined : 'chevrons-up-down'}
  role={ariaHidden ? undefined : 'img'}
  onmouseenter={handleMouseEnter}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
    class="chevrons-up-down-icon"
  >
    <path d="m7 15 5 5 5-5" class:chevron-down={animate} />
    <path d="m7 9 5-5 5 5" class:chevron-up={animate} />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .chevrons-up-down-icon {
    overflow: visible;
  }

  .chevrons-up-down-icon path {
    transition: all 0.2s ease-in;
  }

  .chevron-up {
    transform: translateY(-3px);
  }

  .chevron-down {
    transform: translateY(3px);
  }
</style>
