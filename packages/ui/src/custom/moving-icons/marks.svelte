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

<div class={className} aria-label="book-check" role="img" onmouseenter={handleMouseEnter}>
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
    class="book-check-icon"
    class:animate={isHovered}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
    <path d="m9 9.5 2 2 4-4" class="check-path" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .book-check-icon {
    overflow: visible;
  }
  .check-path {
    stroke-dasharray: 9;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.125s ease-out,
      opacity 0.125s ease-out;
  }

  .book-check-icon.animate {
    animation: bookAnimation 0.6s ease forwards;
  }

  .book-check-icon.animate .check-path {
    animation: checkAnimation 0.5s ease-out backwards;
  }

  @keyframes bookAnimation {
    0% {
      transform: scale(1) rotate(0deg) translateY(0);
    }
    20% {
      transform: scale(1.04) rotate(-8deg) translateY(-2px);
    }
    50% {
      transform: scale(1.04) rotate(8deg) translateY(-2px);
    }
    80% {
      transform: scale(1.04) rotate(-8deg) translateY(-2px);
    }
    100% {
      transform: scale(1) rotate(0deg) translateY(0);
    }
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
