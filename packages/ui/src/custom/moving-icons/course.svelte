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
    }, 600);
  }
</script>

<div class={className} aria-label="book-text" role="img" onmouseenter={handleMouseEnter}>
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
    class="book-text-icon"
    class:animate={isHovered}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
    <path d="M8 11h8" class="text-line text-line-1" />
    <path d="M8 7h6" class="text-line text-line-2" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .book-text-icon {
    overflow: visible;
  }

  .text-line {
    stroke-dasharray: 8;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.3s ease,
      opacity 0.3s ease;
  }

  .book-text-icon.animate {
    animation: bookAnimation 0.6s ease-in-out;
  }

  .book-text-icon.animate .text-line {
    animation: textLineAnimation 0.6s ease;
  }

  .book-text-icon.animate .text-line-1 {
    animation-delay: 0.1s;
  }

  .book-text-icon.animate .text-line-2 {
    animation-delay: 0.2s;
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

  @keyframes textLineAnimation {
    0% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
    50% {
      stroke-dashoffset: 8;
      opacity: 0.5;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }
</style>
