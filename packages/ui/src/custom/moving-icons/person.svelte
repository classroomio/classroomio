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

<div class={className} aria-label="user" role="img" onmouseenter={handleMouseEnter}>
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
    class="user-icon"
    class:animate={isHovered}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" class="user-path" />
    <circle cx="12" cy="7" r="4" class="user-circle" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }

  .user-path,
  .user-circle {
    transition: transform 0.6s ease-in-out;
  }

  .user-icon.animate .user-path {
    animation: pathBounce 0.6s ease-in-out;
  }

  .user-icon.animate .user-circle {
    animation: circleBounce 0.6s ease-in-out;
  }

  @keyframes pathBounce {
    0% {
      transform: translateY(0);
    }
    33% {
      transform: translateY(2px);
    }
    66% {
      transform: translateY(-2px);
    }
    100% {
      transform: translateY(0);
    }
  }

  @keyframes circleBounce {
    0% {
      transform: translateY(0);
    }
    33% {
      transform: translateY(4px);
    }
    66% {
      transform: translateY(-2px);
    }
    100% {
      transform: translateY(0);
    }
  }
</style>
