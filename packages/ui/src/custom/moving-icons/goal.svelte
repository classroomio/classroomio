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
    }, 500);
  }
</script>

<div class={className} aria-label="list-checks" role="img" onmouseenter={handleMouseEnter}>
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
    class="list-checks-icon"
    class:animate={isHovered}
  >
    <path d="M3 17l2 2 4-4" class="check-path" />
    <path d="M3 7l2 2 4-4" class="check-path" />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .list-checks-icon {
    overflow: visible;
  }

  .check-path {
    stroke-dasharray: 9;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.125s ease-out,
      opacity 0.125s ease-out;
  }

  .list-checks-icon.animate .check-path {
    animation: checkAnimation 0.5s ease-out backwards;
  }

  @keyframes checkAnimation {
    0% {
      stroke-dashoffset: 9;
      opacity: 0;
    }
    33% {
      stroke-dashoffset: 9;
      opacity: 0;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }
</style>
