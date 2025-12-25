<script lang="ts" module>
  import { CustomImg as img } from '$lib/components';
  export { img };
</script>

<script>
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();
</script>

{@render children?.()}
