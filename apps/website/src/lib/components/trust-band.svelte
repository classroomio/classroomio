<script>
  /**
   * @typedef {Object} Props
   * @property {string} caption        Eyebrow caption (e.g. "For partner programs at")
   * @property {string[]} items        Items shown pipe-separated
   */

  /** @type {Props} */
  let { caption, items } = $props();
</script>

<section class="border-b border-gray-100 bg-white px-6 py-12 md:px-10 md:py-14">
  <div class="max-w-content mx-auto w-full">
    <p class="text-label mb-6 text-center font-mono text-gray-500 uppercase">{caption}</p>
    <div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-[15px] font-medium text-gray-500">
      {#each items as item, i}
        {#if i > 0}<span class="text-gray-300">·</span>{/if}
        <span>{item}</span>
      {/each}
    </div>
  </div>
</section>
