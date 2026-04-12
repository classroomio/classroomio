<script>
  /**
   * @typedef {Object} Props
   * @property {boolean} [isHovered] - from parent HoverableItem; combined with internal mouseenter pulse
   * @property {string} [color]
   * @property {number} [size]
   * @property {number} [strokeWidth]
   * @property {boolean} [ariaHidden] - when true, icon is treated as decorative (e.g. next to visible text)
   * @property {string} [class]
   */

  /** @type {Props} */
  let {
    isHovered = false,
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    ariaHidden = false,
    class: className = ''
  } = $props();

  let pulseFromMouseEnter = $state(false);

  function handleMouseEnter() {
    if (pulseFromMouseEnter) return;

    pulseFromMouseEnter = true;
    setTimeout(() => {
      pulseFromMouseEnter = false;
    }, 500);
  }

  const arrowAnimates = $derived(isHovered || pulseFromMouseEnter);
</script>

<div
  class={className}
  aria-hidden={ariaHidden ? true : undefined}
  aria-label={ariaHidden ? undefined : 'square-arrow-out-up-right'}
  role={ariaHidden ? undefined : 'img'}
  onmouseenter={handleMouseEnter}
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
  >
    <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
    <g class="arrow" class:animate={arrowAnimates}>
      <path d="m21 3-9 9" />
      <path d="M15 3h6v6" />
    </g>
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .arrow path {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .animate {
    animation: moveUpRight 0.5s;
  }
  @keyframes moveUpRight {
    0%,
    100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(-2px, 2px);
    }
  }
</style>
