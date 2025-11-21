<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import IconButton, { type Props as IconButtonProps } from '$lib/components/IconButton/index.svelte';

  interface Props {
    onClick?: IconButtonProps['onClick'];
    contained?: boolean;
    color?: string;
    size?: IconButtonProps['size'];
    toolTipProps?: IconButtonProps['toolTipProps'];
  }

  let {
    onClick = () => {},
    contained = false,
    color = 'text-primary-700 bg-primary-200 dark:bg-neutral-500',
    size = 'small'
  }: Props = $props();
</script>

<IconButton {onClick} {color} {contained} {size}>
  <XIcon size={size === 'large' ? 24 : 16} class="dark:text-black" />
</IconButton>
