<script>
  export let value;
  export let index;
</script>

{#if value === index}
  <slot />
{/if}
