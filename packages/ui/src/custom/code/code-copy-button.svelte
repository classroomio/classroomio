<script lang="ts">
  import { CopyButton } from '../../base/copy-button';
  import { cn } from '../../tools';
  import { useCodeCopyButton } from './code-utils.svelte';
  import type { CodeCopyButtonProps } from './types';

  let {
    ref = $bindable(null),
    variant = 'secondary',
    size = 'icon-sm',
    class: className,
    ...rest
  }: CodeCopyButtonProps = $props();

  const copyButton = useCodeCopyButton();
</script>

<CopyButton
  class={cn('ui:absolute ui:top-2 ui:right-2', className)}
  text={copyButton.code}
  {variant}
  {size}
  {...rest}
/>
