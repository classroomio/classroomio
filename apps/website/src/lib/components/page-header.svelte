<script>
  /**
   * @typedef {Object} Props
   * @property {string} [className]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { className = '', children } = $props();
</script>

<header class="hero-bg w-full border-b border-slate-100 pb-16 pt-32 lg:min-h-[20rem] {className}">
  {@render children?.()}
</header>
