<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { CloseIcon } from '@cio/ui/custom/moving-icons';

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
    <CloseIcon size={16} class="[&_svg]:dark:text-white" />
  {/if}
</IconButton>
