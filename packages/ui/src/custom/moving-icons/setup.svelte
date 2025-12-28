<script lang="ts">
  /**
   * @typedef {Object} Props
   * @property {string} [color]
   * @property {number} [size]
   * @property {number} [strokeWidth]
   * @property {boolean} [isHovered]
   * @property {string} [class]
   */

  /** @type {Props} */
  let { color = 'currentColor', size = 28, strokeWidth = 2, isHovered = false, class: className = '' } = $props();

  // Group 1 coordinates
  let line1a_x2 = $state(14);
  let line1b_x1 = $state(10);
  let line1c_x1 = $state(14);
  let line1c_x2 = $state(14);

  // Group 2 coordinates
  let line2a_x2 = $state(12);
  let line2b_x1 = $state(8);
  let line2c_x1 = $state(8);
  let line2c_x2 = $state(8);

  // Group 3 coordinates
  let line3a_x2 = $state(12);
  let line3b_x1 = $state(16);
  let line3c_x1 = $state(16);
  let line3c_x2 = $state(16);

  function animateValue(start: number, end: number, duration: number, callback: (val: number) => void) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Spring-like easing: cubic-bezier(0.34, 1.56, 0.64, 1)
        const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const current = start + (end - start) * eased;
        callback(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve(true);
        }
      };
      requestAnimationFrame(animate);
    });
  }

  function handleMouseEnter() {
    // Animate all values simultaneously
    Promise.all([
      animateValue(14, 10, 400, (val) => {
        line1a_x2 = val;
      }),
      animateValue(10, 5, 400, (val) => {
        line1b_x1 = val;
      }),
      animateValue(14, 9, 400, (val) => {
        line1c_x1 = val;
        line1c_x2 = val;
      }),
      animateValue(12, 18, 400, (val) => {
        line2a_x2 = val;
      }),
      animateValue(8, 13, 400, (val) => {
        line2b_x1 = val;
      }),
      animateValue(8, 14, 400, (val) => {
        line2c_x1 = val;
        line2c_x2 = val;
      }),
      animateValue(12, 4, 400, (val) => {
        line3a_x2 = val;
      }),
      animateValue(16, 8, 400, (val) => {
        line3b_x1 = val;
      }),
      animateValue(16, 8, 400, (val) => {
        line3c_x1 = val;
        line3c_x2 = val;
      })
    ]);
  }

  $effect(() => {
    if (isHovered) {
      handleMouseEnter();
    }
  });
</script>

<div class={className} aria-label="sliders-horizontal" role="img">
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
    class="sliders-icon"
  >
    <!-- Group 1 -->
    <line x1="21" x2={line1a_x2} y1="4" y2="4" />
    <line x1={line1b_x1} x2="3" y1="4" y2="4" />
    <line x1={line1c_x1} x2={line1c_x2} y1="2" y2="6" />

    <!-- Group 2 -->
    <line x1="21" x2={line2a_x2} y1="12" y2="12" />
    <line x1={line2b_x1} x2="3" y1="12" y2="12" />
    <line x1={line2c_x1} x2={line2c_x2} y1="10" y2="14" />

    <!-- Group 3 -->
    <line x1="3" x2={line3a_x2} y1="20" y2="20" />
    <line x1={line3b_x1} x2="21" y1="20" y2="20" />
    <line x1={line3c_x1} x2={line3c_x2} y1="18" y2="22" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }

  .sliders-icon {
    overflow: visible;
  }
</style>
