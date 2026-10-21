<script lang="ts">
  import PackageCheck from '@lucide/svelte/icons/package-check';

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

<div class={className} aria-label="package-check" role="img" onmouseenter={handleMouseEnter}>
  <PackageCheck {size} {color} {strokeWidth} class={`package-check-icon ${isHovered ? ' animate' : ''}`} />
</div>

<style>
  div {
    display: inline-block;
  }
  .package-check-icon {
    overflow: visible;
  }
  .package-check-icon.animate {
    animation: checkAnimation 0.5s ease-out;
  }
  @keyframes checkAnimation {
    0% {
      transform: scale(0.9);
      opacity: 0.75;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
