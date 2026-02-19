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
    }, 600);
  }
</script>

<div class={className} aria-label="book-type" role="img" onmouseenter={handleMouseEnter}>
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
    class="book-type-icon"
    class:animate={isHovered}
  >
    <path d="M10 13h4" />
    <path d="M12 6v7" />
    <path d="M16 8V6H8v2" />
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .book-type-icon {
    overflow: visible;
  }

  .book-type-icon.animate {
    animation: bookAnimation 0.6s ease-in-out;
  }

  @keyframes bookAnimation {
    0% {
      transform: scale(1) rotate(0deg) translateY(0);
    }
    20% {
      transform: scale(1.04) rotate(-8deg) translateY(-2px);
    }
    50% {
      transform: scale(1.04) rotate(8deg) translateY(-2px);
    }
    80% {
      transform: scale(1.04) rotate(-8deg) translateY(-2px);
    }
    100% {
      transform: scale(1) rotate(0deg) translateY(0);
    }
  }
</style>
