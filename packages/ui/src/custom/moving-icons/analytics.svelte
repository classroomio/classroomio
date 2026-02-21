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
    }, 700);
  }
</script>

<div class={className} aria-label="chart-line" role="img" onmouseenter={handleMouseEnter}>
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
    class="chart-line-icon"
    class:animate={isHovered}
  >
    <path d="M3 3v16a2 2 0 0 0 2 2h16" class="frame" />
    <path d="m7 13 3-3 4 4 5-5" class="line" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .chart-line-icon {
    overflow: visible;
  }

  .line {
    stroke-dasharray: 17;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.3s ease,
      opacity 0.3s ease;
  }

  .chart-line-icon.animate .line {
    animation: lineAnimation 0.6s ease backwards;
  }

  @keyframes lineAnimation {
    0% {
      stroke-dashoffset: 17;
      opacity: 1;
    }
    15% {
      stroke-dashoffset: 17;
      opacity: 0;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }
</style>
