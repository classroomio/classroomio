<script>
  /**
   * @typedef {Object} Props
   * @property {string} [className]
   * @property {boolean} [open]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { className = '', open = false, children } = $props();
</script>

{#if open}
  <div class="relative flex items-center justify-center">
    <!-- black background -->
    <div class="fixed z-[3000] top-0 left-0 w-full h-full bg-black opacity-[0.7]"></div>
    <div
      class="fixed z-[3001] {className} w-full md:w-[30%] md:min-w-[500px] bg-white rounded-md mx-auto py-6 px-7"
    >
      {@render children?.()}
    </div>
  </div>
{/if}
