<script lang="ts">
  let { value, index, children } = $props();
</script>

{#if value === index}
  {@render children?.()}
{/if}
