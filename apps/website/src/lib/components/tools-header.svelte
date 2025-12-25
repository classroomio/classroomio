<script>
  /**
   * @typedef {Object} Props
   * @property {string} [className]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { className = '', children } = $props();
</script>

<header class="tools-hero-bg py-24 text-center {className} border-b border-slate-100 bg-white">
  {@render children?.()}
</header>
