<script>
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();
</script>

<script lang="ts" module>
  import { CustomImg as img } from '$lib/components';
  export { img };
</script>

{@render children?.()}
