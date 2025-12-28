<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { Spinner } from '@cio/ui/base/spinner';
  import { IconButton } from '@cio/ui/custom/icon-button';

  interface Props {
    onClick?: (value: string) => void;
    isClosing?: boolean;
    tooltip?: string;
  }

  let { onClick = () => {}, isClosing = false, tooltip }: Props = $props();

  function handleClick() {
    onClick('');
  }
</script>

<IconButton {tooltip} onclick={handleClick} disabled={isClosing}>
  {#if isClosing}
    <Spinner class="size-5 text-blue-700!" />
  {:else}
    <XIcon size={16} class="dark:text-black" />
  {/if}
</IconButton>
