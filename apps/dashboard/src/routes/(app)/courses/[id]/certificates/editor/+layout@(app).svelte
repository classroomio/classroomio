<script lang="ts">
  let { children }: { children?: import('svelte').Snippet } = $props();
</script>

{@render children?.()}
