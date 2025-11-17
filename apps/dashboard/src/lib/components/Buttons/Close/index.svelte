<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { Circle } from 'svelte-loading-spinners';
  import IconButton, { type Props as IconButtonProps } from '$lib/components/IconButton/index.svelte';

  interface Props {
    onClick?: IconButtonProps['onClick'];
    contained?: boolean;
    isClosing?: boolean;
    color?: string;
    size?: IconButtonProps['size'];
    toolTipProps?: IconButtonProps['toolTipProps'];
  }

  let {
    onClick = () => {},
    contained = false,
    isClosing = false,
    color = 'text-primary-700 bg-primary-200 dark:bg-neutral-500',
    size = 'small'
  }: Props = $props();
</script>

<IconButton {onClick} {color} {contained} {size} disabled={isClosing}>
  {#if isClosing}
    <Circle size="20" color="#1d4ee2" unit="px" duration="1s" />
  {:else}
    <XIcon size={size === 'large' ? 24 : 16} class="carbon-icon dark:text-black" />
  {/if}
</IconButton>
