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
    }, 700);
  }
</script>

<div class={className} aria-label="chart-column" role="img" onmouseenter={handleMouseEnter}>
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
    class="chart-column-icon"
    class:animate={showMotion}
  >
    <path d="M3 3v16a2 2 0 0 0 2 2h16" class="frame" />
    <path d="M18 17V9" class="column column-2" />
    <path d="M13 17V5" class="column column-1" />
    <path d="M8 17v-3" class="column column-0" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .chart-column-icon {
    overflow: visible;
  }

  .column {
    stroke-dasharray: 12;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.3s ease,
      opacity 0.3s ease;
  }

  .chart-column-icon.animate .column {
    animation: columnAnimation 0.6s ease forwards;
  }

  .chart-column-icon.animate .column-0 {
    animation-delay: 0s;
  }

  .chart-column-icon.animate .column-1 {
    animation-delay: 0.1s;
  }

  .chart-column-icon.animate .column-2 {
    animation-delay: 0.2s;
  }

  @keyframes columnAnimation {
    0% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
    50% {
      stroke-dashoffset: 12;
      opacity: 0;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }
</style>
