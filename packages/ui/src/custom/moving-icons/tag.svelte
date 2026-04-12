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
    }, 500);
  }
</script>

<div class={className} aria-label="tag" role="img" onmouseenter={handleMouseEnter}>
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
    class="tag-icon"
    class:animate={isHovered}
  >
    <path
      d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
    />
    <circle cx="7.5" cy="7.5" r=".5" fill={color} />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }

  .tag-icon {
    overflow: visible;
  }

  .tag-icon.animate {
    transform-origin: top left;
    animation: tagRotate 0.5s ease-in-out;
  }

  @keyframes tagRotate {
    0% {
      transform: rotate(0deg);
    }
    40% {
      transform: rotate(10deg);
    }
    80% {
      transform: rotate(-5deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
</style>
