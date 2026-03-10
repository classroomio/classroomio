<script>
  import { spring } from 'svelte/motion';

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

  const animatedX = spring(0, {
    stiffness: 200,
    damping: 13
  });

  function handleMouseEnter() {
    isHovered = true;
    animatedX.set(-6);

    setTimeout(() => {
      isHovered = false;
      animatedX.set(0);
    }, 300);
  }

  $effect(() => {
    if (isHovered) {
      handleMouseEnter();
    }
  });
</script>

<div class={className} aria-label="users" role="img" onmouseenter={handleMouseEnter}>
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
    class="users-icon"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" style="transform: translateX({$animatedX}px)" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" style="transform: translateX({$animatedX}px)" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .users-icon {
    overflow: visible;
  }

  .users-icon path,
  .users-icon circle {
    transition: all 0.3s ease;
  }
</style>
