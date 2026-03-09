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

<div class={className} aria-label="square-kanban" role="img" onmouseenter={handleMouseEnter}>
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
    class="square-kanban-icon"
    class:animate={isHovered}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M8 7v7" class="column column-0" />
    <path d="M12 7v4" class="column column-1" />
    <path d="M16 7v9" class="column column-2" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .square-kanban-icon {
    overflow: visible;
  }

  .column {
    stroke-dasharray: 20;
    stroke-dashoffset: 0;
    transition:
      stroke-dashoffset 0.3s ease,
      opacity 0.3s ease;
  }

  .square-kanban-icon.animate .column {
    animation: columnAnimation 0.6s ease forwards;
  }

  .square-kanban-icon.animate .column-0 {
    animation-delay: 0s;
  }

  .square-kanban-icon.animate .column-1 {
    animation-delay: 0.1s;
  }

  .square-kanban-icon.animate .column-2 {
    animation-delay: 0.2s;
  }

  @keyframes columnAnimation {
    0% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
    50% {
      stroke-dashoffset: 20;
      opacity: 0;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }
</style>
