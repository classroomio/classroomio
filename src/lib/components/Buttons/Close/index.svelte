<script>
  import CloseIcon from 'carbon-icons-svelte/lib/Close.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';

  export let onClick;
  export let contained;
  export let color = '';
  export let size = 'large';
</script>

<IconButton {onClick} {color} {contained} {size}>
  {#if size === 'large'}
    <CloseIcon size={24} class="carbon-icon" title="Delete" />
  {:else}
    <CloseIcon size={24} class="carbon-icon" title="Delete" />
  {/if}
</IconButton>
