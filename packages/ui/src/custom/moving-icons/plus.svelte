<script lang="ts">
  import { onDestroy } from 'svelte';

  interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    animate?: boolean;
    isHovered?: boolean;
    ariaHidden?: boolean;
    class?: string;
  }

  let {
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    animate: animateProp = false,
    isHovered = false,
    ariaHidden = false,
    class: className = ''
  }: IconProps = $props();

  let hoverAnimate = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  const animate = $derived(animateProp || isHovered || hoverAnimate);

  function handleMouseEnter() {
    if (animate) return;

    hoverAnimate = true;
    resetTimer = setTimeout(() => {
      hoverAnimate = false;
    }, 500);
  }

  onDestroy(() => clearTimeout(resetTimer));
</script>

<div
  class={className}
  aria-hidden={ariaHidden ? true : undefined}
  aria-label={ariaHidden ? undefined : 'plus'}
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
    class="plus"
    class:animate
  >
    <path d="M5 12h14" class="horizontal" />
    <path d="M12 5v14" class="vertical" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .plus {
    overflow: visible;
  }

  .horizontal,
  .vertical {
    stroke-dasharray: 14;
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 0.15s ease-out;
  }

  .plus.animate .horizontal {
    opacity: 0;
    animation: lineAnimation 0.3s ease-out forwards;
  }

  .plus.animate .vertical {
    opacity: 0;
    animation: lineAnimation 0.3s ease-out 0.25s forwards;
  }

  @keyframes lineAnimation {
    0% {
      opacity: 0;
      stroke-dashoffset: 14;
    }
    15% {
      opacity: 1;
      stroke-dashoffset: 14;
    }
    100% {
      opacity: 1;
      stroke-dashoffset: 0;
    }
  }
</style>
