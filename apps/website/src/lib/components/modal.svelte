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
    <div class="fixed left-0 top-0 z-[3000] h-full w-full bg-black opacity-[0.7]"></div>
    <div class="fixed z-[3001] {className} mx-auto w-full rounded-md bg-white px-7 py-6 md:w-[30%] md:min-w-[500px]">
      {@render children?.()}
    </div>
  </div>
{/if}
