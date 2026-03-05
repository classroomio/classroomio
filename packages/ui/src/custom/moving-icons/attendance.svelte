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

<div class={className} aria-label="book-open-check" role="img" onmouseenter={handleMouseEnter}>
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
    class="book-open-check-icon"
    class:animate={isHovered}
  >
    <path d="M12 21V7" />
    <path d="m16 12 2 2 4-4" class="check-path" />
    <path
      d="M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3"
    />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .book-open-check-icon {
    overflow: visible;
  }
  .check-path {
    stroke-dasharray: 9;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.125s ease-out,
      opacity 0.125s ease-out;
  }
  .book-open-check-icon.animate .check-path {
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
