<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { Spinner } from '@cio/ui/base/spinner';
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
    <Spinner class="text-blue-700! size-5" />
  {:else}
    <XIcon size={size === 'large' ? 24 : 16} class="dark:text-black" />
  {/if}
</IconButton>
