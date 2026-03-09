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
    }, 1500);
  }
</script>

<div class={className} aria-label="book-open-text" role="img" onmouseenter={handleMouseEnter}>
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
    class="book-open-text-icon"
    class:animate={isHovered}
  >
    <path d="M12 7v14" class="center-line" />
    <path d="M16 12h2" class="ui:text-line ui:text-line-right-bottom" />
    <path d="M16 8h2" class="ui:text-line ui:text-line-right-top" />
    <path
      d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
      class="book-path"
    />
    <path d="M6 12h2" class="ui:text-line ui:text-line-left-bottom" />
    <path d="M6 8h2" class="ui:text-line ui:text-line-left-top" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }

  .book-open-text-icon {
    overflow: visible;
    transform-origin: center;
    transition: transform 0.3s ease;
  }

  .book-open-text-icon.animate {
    animation: bookOpen 0.8s ease;
  }

  .book-path {
    transform-origin: center bottom;
    transition: transform 0.3s ease;
  }

  .book-open-text-icon.animate .book-path {
    animation: bookPages 0.8s ease;
  }

  .center-line {
    transform-origin: center bottom;
    transition: transform 0.3s ease;
  }

  .book-open-text-icon.animate .center-line {
    animation: bookPages 0.8s ease;
  }

  .text-line {
    stroke-dasharray: 3;
    stroke-dashoffset: 0;
    transform-origin: center bottom;
    transition:
      stroke-dashoffset 0s,
      transform 0.3s ease;
  }

  .book-open-text-icon.animate .text-line {
    stroke-dashoffset: 3;
    animation: bookPages 0.8s ease;
  }

  .book-open-text-icon.animate .text-line-left-top {
    animation:
      bookPages 0.8s ease,
      drawLine 0.4s ease 0.2s forwards;
  }

  .book-open-text-icon.animate .text-line-left-bottom {
    animation:
      bookPages 0.8s ease,
      drawLine 0.4s ease 0.4s forwards;
  }

  .book-open-text-icon.animate .text-line-right-top {
    animation:
      bookPages 0.8s ease,
      drawLine 0.4s ease 0.6s forwards;
  }

  .book-open-text-icon.animate .text-line-right-bottom {
    animation:
      bookPages 0.8s ease,
      drawLine 0.4s ease 0.8s forwards;
  }

  @keyframes bookOpen {
    0% {
      transform: scale(1);
    }
    20% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes bookPages {
    0% {
      transform: scaleY(1);
    }
    30% {
      transform: scaleY(1.1);
    }
    100% {
      transform: scaleY(1);
    }
  }

  @keyframes drawLine {
    0% {
      stroke-dashoffset: 3;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
</style>
