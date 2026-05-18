<script>
  /**
   * @typedef {Object} Props
   * @property {string} caption        Eyebrow caption (e.g. "For partner programs at")
   * @property {string[]} items        Items shown pipe-separated
   */

  /** @type {Props} */
  let { caption, items } = $props();
</script>

<section class="border-b border-gray-100 bg-white px-6 py-10 lg:px-12">
  <div class="mx-auto max-w-[1100px]">
    <p class="mb-6 text-center text-xs font-medium tracking-widest text-gray-500 uppercase">{caption}</p>
    <div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-medium text-gray-500">
      {#each items as item, i}
        {#if i > 0}<span class="text-gray-300">·</span>{/if}
        <span>{item}</span>
      {/each}
    </div>
  </div>
</section>
