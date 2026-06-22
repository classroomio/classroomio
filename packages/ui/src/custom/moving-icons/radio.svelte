<script>
  /**
   * Broadcast / "live" indicator. Standard moving-icon behavior: static by
   * default, plays a brief signal animation on hover via `isHovered`. The
   * center is filled so it reads as a recording dot.
   *
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
    if (isHovered) return;
    isHovered = true;
    setTimeout(() => {
      isHovered = false;
    }, 700);
  }
</script>

<div class={className} aria-label="live session" role="img" onmouseenter={handleMouseEnter}>
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
    class="radio-icon"
    class:animate={isHovered}
  >
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" class="radio-level radio-line-3" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" class="radio-level radio-line-2" />
    <circle cx="12" cy="12" r="2" fill={color} stroke="none" class="radio-level radio-line-1" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" class="radio-level radio-line-2" />
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" class="radio-level radio-line-3" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
    line-height: 0;
  }

  .radio-icon {
    overflow: visible;
  }

  .radio-level {
    opacity: 1;
    transition: opacity 0.2s ease;
  }

  .radio-icon.animate .radio-level {
    animation: fadeInSequence 0.6s ease forwards;
  }

  .radio-icon.animate .radio-line-1 {
    opacity: 0;
    animation-delay: 0.15s;
  }

  .radio-icon.animate .radio-line-2 {
    opacity: 0;
    animation-delay: 0.25s;
  }

  .radio-icon.animate .radio-line-3 {
    opacity: 0;
    animation-delay: 0.35s;
  }

  @keyframes fadeInSequence {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
