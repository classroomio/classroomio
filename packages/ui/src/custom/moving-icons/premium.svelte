<script>
  /**
   * @typedef {Object} Props
   * @property {string} [color]
   * @property {number} [size]
   * @property {number} [strokeWidth]
   * @property {boolean} [isHovered]
   * @property {string} [class]
   */

  /** @type {Props} */
  let { color = 'currentColor', size = 24, strokeWidth = 2, isHovered = false, class: className = '' } = $props();

  function handleMouseEnter() {
    isHovered = true;

    setTimeout(() => {
      isHovered = false;
    }, 750);
  }
</script>

<div class={className} aria-label="sparkles" role="img" onmouseenter={handleMouseEnter}>
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
    class="sparkles-icon"
    class:animate={isHovered}
  >
    <g class="sparkles-group">
      <path
        d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
        class="sparkles-path"
      />
    </g>
    <path d="M20 2v4 M22 4h-4" class="sparkles-plus" />
    <circle cx="4" cy="20" r="2" class="sparkles-circle" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }

  .sparkles-icon {
    overflow: visible;
  }

  .sparkles-group {
    transform-origin: center;
    transition: transform 0.6s ease-in-out;
  }

  .sparkles-icon.animate .sparkles-group {
    animation: scaleGroup 0.6s ease-in-out;
  }

  .sparkles-plus {
    opacity: 1;
    transform: scale(1);
    transform-origin: center;
    transform-box: fill-box;
    transition:
      opacity 0.2s ease-in-out,
      transform 0.2s ease-in-out;
  }

  .sparkles-icon.animate .sparkles-plus {
    animation: pulsePlus 0.75s ease-in-out;
  }

  .sparkles-circle {
    opacity: 1;
    transform: scale(1);
    transform-origin: center;
    transform-box: fill-box;
    transition:
      opacity 0.2s ease-in-out,
      transform 0.2s ease-in-out;
  }

  .sparkles-icon.animate .sparkles-circle {
    animation: pulseCircle 0.6s ease-in-out;
  }

  @keyframes scaleGroup {
    0% {
      transform: scale(1);
    }
    33.33% {
      transform: scale(0.9);
    }
    66.67% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes pulsePlus {
    0%,
    20% {
      opacity: 1;
      transform: scale(1);
    }
    46.67% {
      opacity: 0;
      transform: scale(0);
    }
    73.33% {
      opacity: 0;
      transform: scale(0);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes pulseCircle {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    33.33% {
      opacity: 0;
      transform: scale(0);
    }
    66.67% {
      opacity: 0;
      transform: scale(0);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
