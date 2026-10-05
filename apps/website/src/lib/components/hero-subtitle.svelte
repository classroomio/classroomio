<script>
  /**
   * Standard hero subtitle paragraph used across marketing pages.
   * Defaults: `text-lead mt-6 max-w-[640px] text-gray-600`.
   * Pass `class` to override or extend (e.g. a different max-width).
   *
   * @typedef {Object} Props
   * @property {string} [class]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { class: className = '', children } = $props();
</script>

<p class="text-lead mt-6 max-w-[640px] text-gray-600 {className}">
  {@render children?.()}
</p>
