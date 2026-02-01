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

<div class={className} aria-label="eye" role="img" onmouseenter={handleMouseEnter}>
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
    class="eye-icon"
    class:blink={isHovered}
  >
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" class="pupil" class:blink-pupil={isHovered} />
  </svg>
</div>

<style>
  .eye-icon {
    transform-origin: center;
  }

  .blink {
    animation: blink 0.5s ease-in-out;
  }

  .blink-pupil {
    animation: blink-pupil 0.5s ease-in-out;
  }

  @keyframes blink {
    0% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(0.1);
    }
    100% {
      transform: scaleY(1);
    }
  }

  @keyframes blink-pupil {
    0% {
      opacity: 1;
    }
    40% {
      opacity: 0;
    }
    60% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
