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

<div class={className} aria-label="hand-coins" role="img" onmouseenter={handleMouseEnter}>
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
    class="hand-coins-icon"
    class:animate={isHovered}
  >
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
    <path d="m2 16 6 6" />
    <circle class="first-circle" cx="16" cy="9" r="2.9" />
    <circle class="second-circle" cx="6" cy="5" r="3" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .hand-coins-icon {
    overflow: visible;
  }

  .first-circle,
  .second-circle {
    opacity: 1;
  }

  @keyframes throw {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    50% {
      transform: translateY(-10px);
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .hand-coins-icon.animate .first-circle {
    animation: throw 0.6s ease-in forwards;
    animation-delay: 0s;
  }

  .hand-coins-icon.animate .second-circle {
    animation: throw 0.6s ease-in forwards;
    animation-delay: 0.15s;
  }
</style>
