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
  }

  function handleMouseLeave() {
    isHovered = false;
  }
</script>

<div
  class={className}
  aria-label="message-circle-more"
  role="img"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
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
    class="message-circle-more-icon"
    class:animate={isHovered}
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <path d="M8 12h.01" class="dot dot1" />
    <path d="M12 12h.01" class="dot dot2" />
    <path d="M16 12h.01" class="dot dot3" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .message-circle-more-icon {
    overflow: visible;
  }

  .dot {
    opacity: 1;
    transition: opacity 0.1s ease;
  }

  .message-circle-more-icon.animate .dot {
    animation: dotAnimation 1.5s infinite;
  }

  .message-circle-more-icon.animate .dot1 {
    animation-delay: 0s;
  }

  .message-circle-more-icon.animate .dot2 {
    animation-delay: 0.1s;
  }

  .message-circle-more-icon.animate .dot3 {
    animation-delay: 0.2s;
  }

  @keyframes dotAnimation {
    0%,
    100% {
      opacity: 1;
    }
    10%,
    20% {
      opacity: 0;
    }
    30%,
    50% {
      opacity: 1;
    }
    60%,
    70% {
      opacity: 0;
    }
    80%,
    90% {
      opacity: 1;
    }
  }
</style>
