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

  function handleMouseEnter() {
    isHovered = true;
  }

  function handleMouseLeave() {
    isHovered = false;
  }
</script>

<div
  class={className}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  aria-label="cloud-upload"
  role="img"
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
    <g class:animate={isHovered}>
      <path d="M12 13v8" />
      <path d="m8 17 4-4 4 4" />
    </g>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  g.animate path {
    transform: translateY(-2px);
    transition: transform 0.3s cubic-bezier(0.68, -0.6, 0.32, 1.6);
  }
  g path {
    transform: translateY(0);
    transition: transform 0.3s cubic-bezier(0.68, -0.6, 0.32, 1.6);
  }
</style>
