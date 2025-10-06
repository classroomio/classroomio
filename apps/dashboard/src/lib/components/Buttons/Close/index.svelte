<script lang="ts">
  import CloseIcon from 'carbon-icons-svelte/lib/Close.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';

  interface Props {
    onClick?: any;
    contained?: boolean;
    color?: string;
    size?: string;
  }

  let {
    onClick = () => {},
    contained = false,
    color = 'text-primary-700 bg-primary-200 dark:bg-neutral-500',
    size = 'small'
  }: Props = $props();
</script>

<IconButton {onClick} {color} {contained} {size}>
  {#if size === 'large'}
    <CloseIcon size={24} class="carbon-icon dark:text-black" title="Delete" />
  {:else}
    <CloseIcon size={20} class="carbon-icon dark:text-black" title="Delete" />
  {/if}
</IconButton>
<!-- color="text-primary-700 bg-primary-200 dark:bg-gray-200 dark:text-black" -->
