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
    }, 1000);
  }
</script>

<div class={className} aria-label="award" role="img" onmouseenter={handleMouseEnter}>
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
    class="award-icon"
    class:animate={isHovered}
  >
    <path
      d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"
    />
    <circle cx="12" cy="8" r="6" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .award-icon {
    transform-origin: center;
    transition: all 0.5s ease-in-out;
  }

  .award-icon.animate {
    animation: enlarge 1s ease;
  }

  @keyframes enlarge {
    30% {
      transform: rotate(20deg) scale(1.2);
    }
    60% {
      transform: rotate(-20deg) scale(1.2);
    }
    1000% {
      transform: rotate(0deg) scale(1);
    }
  }
</style>
