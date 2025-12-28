<script>
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet<[boolean]>} children
   * @property {string} [class]
   */

  /** @type {Props} */
  let { children, class: className = '' } = $props();

  let isHovered = $state(false);
</script>

<div class={className} onmouseenter={() => (isHovered = true)} onmouseleave={() => (isHovered = false)}>
  {@render children(isHovered)}
</div>
