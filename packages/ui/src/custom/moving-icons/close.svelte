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

<div class={className} aria-label="x" role="img" onmouseenter={handleMouseEnter}>
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
    class="x"
    class:animate={isHovered}
  >
    <path d="M18 6 6 18" class="diagonal-1" />
    <path d="m6 6 12 12" class="diagonal-2" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .x {
    overflow: visible;
  }

  .diagonal-1,
  .diagonal-2 {
    stroke-dasharray: 17;
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 0.15s ease-out;
  }

  .x.animate .diagonal-1 {
    opacity: 0;
    animation: lineAnimation 0.3s ease-out forwards;
  }

  .x.animate .diagonal-2 {
    opacity: 0;
    animation: lineAnimation 0.3s ease-out 0.25s forwards;
  }

  @keyframes lineAnimation {
    0% {
      opacity: 0;
      stroke-dashoffset: 17;
    }
    15% {
      opacity: 1;
      stroke-dashoffset: 17;
    }
    100% {
      opacity: 1;
      stroke-dashoffset: 0;
    }
  }
</style>
