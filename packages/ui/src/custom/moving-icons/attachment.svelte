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
    if (isHovered) return;
    isHovered = true;

    setTimeout(() => {
      isHovered = false;
    }, 700);
  }
</script>

<div class={className} aria-label="paperclip" role="img" onmouseenter={handleMouseEnter}>
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
    class="paperclip-icon"
    class:animate={isHovered}
  >
    <path
      d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"
      class="paperclip-path"
    />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .paperclip-icon {
    overflow: visible;
  }

  .paperclip-path {
    stroke-dasharray: 87;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.6s ease-in,
      opacity 0.1s ease-in;
  }

  .paperclip-icon.animate .paperclip-path {
    animation: drawPath 0.6s ease-in forwards;
  }

  @keyframes drawPath {
    0% {
      stroke-dashoffset: 87;
    }
    15% {
      stroke-dashoffset: 87;
    }
    100% {
      stroke-dashoffset: 174;
    }
  }
</style>
