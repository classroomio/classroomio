<script>
  /**
   * @typedef {Object} Props
   * @property {string} [className]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { className = '', children } = $props();
</script>

<header
  class="relative w-full overflow-hidden border-b border-slate-100 pt-28 pb-16 lg:min-h-[20rem] lg:pt-36 lg:pb-20"
>
  <div class="cio-dotfield pointer-events-none absolute inset-0" aria-hidden="true"></div>
  <div class="relative z-10 {className}">
    {@render children?.()}
  </div>
</header>
