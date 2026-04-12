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

<div class={className} aria-label="zap" role="img" onmouseenter={handleMouseEnter}>
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
    class="zap-icon"
    class:motion-active={showMotion}
  >
    <g class="zap-wrap">
      <path
        d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
      />
    </g>
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }

  .zap-icon {
    overflow: visible;
  }

  .zap-wrap {
    transform-box: fill-box;
    transform-origin: center;
  }

  .zap-icon.motion-active .zap-wrap {
    animation: zapJolt 0.58s cubic-bezier(0.34, 1.15, 0.64, 1) forwards;
  }

  @keyframes zapJolt {
    0%,
    100% {
      transform: translate(0, 0) rotate(0deg) scale(1);
    }
    18% {
      transform: translate(0.5px, -2px) rotate(-9deg) scale(1.07);
    }
    40% {
      transform: translate(-0.5px, 1px) rotate(7deg) scale(1.03);
    }
    62% {
      transform: translate(0.25px, -0.25px) rotate(-3deg) scale(1.01);
    }
  }
</style>
