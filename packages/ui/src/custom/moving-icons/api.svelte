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
    isHovered: isParentHovered = false,
    class: className = ''
  }: IconProps = $props();

  let localMotion = $state(false);

  const showMotion = $derived(isParentHovered || localMotion);

  function handleMouseEnter() {
    if (isParentHovered || localMotion) return;
    localMotion = true;

    setTimeout(() => {
      localMotion = false;
    }, 650);
  }
</script>

<div class={className} aria-label="braces" role="img" onmouseenter={handleMouseEnter}>
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
    class="braces-icon"
    class:motion-active={showMotion}
  >
    <g class="brace-left-wrap">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2v5a2 2 0 0 0 2 2h1" />
    </g>
    <g class="brace-right-wrap">
      <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2v5a2 2 0 0 1-2 2h-1" />
    </g>
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }

  .braces-icon {
    overflow: visible;
  }

  .brace-left-wrap,
  .brace-right-wrap {
    transform-box: fill-box;
    transform-origin: center;
  }

  .braces-icon.motion-active .brace-left-wrap {
    animation: braceLeft 0.58s cubic-bezier(0.34, 1.15, 0.64, 1) forwards;
  }

  .braces-icon.motion-active .brace-right-wrap {
    animation: braceRight 0.58s cubic-bezier(0.34, 1.15, 0.64, 1) 0.07s forwards;
  }

  @keyframes braceLeft {
    0%,
    100% {
      transform: translateX(0);
    }
    18% {
      transform: translateX(-2.5px);
    }
    42% {
      transform: translateX(0.6px);
    }
    65% {
      transform: translateX(-0.35px);
    }
  }

  @keyframes braceRight {
    0%,
    100% {
      transform: translateX(0);
    }
    18% {
      transform: translateX(2.5px);
    }
    42% {
      transform: translateX(-0.6px);
    }
    65% {
      transform: translateX(0.35px);
    }
  }
</style>
