<script>
  import Close24 from 'carbon-icons-svelte/lib/Close24';
  import Close16 from 'carbon-icons-svelte/lib/Close16';
  import IconButton from '../../IconButton/index.svelte';

  export let onClick;
  export let contained;
  export let color = '';
  export let size = 'large';
</script>

<IconButton {onClick} {color} {contained} {size}>
  {#if size === 'large'}
    <Close24 class="carbon-icon" title="Delete" />
  {:else}
    <Close16 class="carbon-icon" title="Delete" />
  {/if}
</IconButton>
