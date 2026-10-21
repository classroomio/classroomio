<script lang="ts">
  interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    isHovered?: boolean;
    class?: string;
  }

  let {
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    isHovered = false,
    class: className = ''
  }: IconProps = $props();

  let hovered = $state(false);
  const animate = $derived(isHovered || hovered);

  function handleMouseEnter() {
    if (animate) return;
    hovered = true;

    setTimeout(() => {
      hovered = false;
    }, 500);
  }
</script>

<div class={className} aria-label="package-check" role="img" onmouseenter={handleMouseEnter}>
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
    class="custom package-check-icon"
    class:animate
  >
    <path d="m16 16 2 2 4-4" class="check-path" />
    <path
      d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
    />
    <path d="m7.5 4.27 9 5.15" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" x2="12" y1="22" y2="12" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .package-check-icon {
    overflow: visible;
  }
  .check-path {
    stroke-dasharray: 9;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.125s ease-out,
      opacity 0.125s ease-out;
  }
  .package-check-icon.animate .check-path {
    animation: checkAnimation 0.5s ease-out backwards;
  }
  @keyframes checkAnimation {
    0% {
      stroke-dashoffset: 9;
      opacity: 0;
    }
    33% {
      stroke-dashoffset: 9;
      opacity: 0;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }
</style>
