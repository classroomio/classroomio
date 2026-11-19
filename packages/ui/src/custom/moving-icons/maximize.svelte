<script lang="ts">
  interface IconProps {
    isHovered?: boolean;
    color?: string;
    size?: number;
    strokeWidth?: number;
    animate?: boolean;
    ariaHidden?: boolean;
    class?: string;
  }

  let {
    isHovered = false,
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    animate: animateProp = false,
    ariaHidden = false,
    class: className = ''
  }: IconProps = $props();

  let hoverAnimate = $state(false);
  const animate = $derived(animateProp || isHovered || hoverAnimate);

  function handleMouseEnter() {
    hoverAnimate = true;
  }

  function handleMouseLeave() {
    hoverAnimate = false;
  }
</script>

<div
  class={className}
  aria-hidden={ariaHidden ? true : undefined}
  aria-label={ariaHidden ? undefined : 'maximize-2'}
  role={ariaHidden ? undefined : 'img'}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
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
  >
    <polyline points="15 3 21 3 21 9" class:top-right={animate} />
    <polyline points="9 21 3 21 3 15" class:bottom-left={animate} />
    <line x1="21" x2="14" y1="3" y2="10" class:top-right={animate} />
    <line x1="3" x2="10" y1="21" y2="14" class:bottom-left={animate} />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  polyline,
  line {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .top-right {
    transform: translate(2px, -2px);
  }
  .bottom-left {
    transform: translate(-2px, 2px);
  }
</style>
