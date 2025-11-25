<script lang="ts">
  import { CopyButton } from '../copy-button';
  import type { PasswordCopyButtonProps } from './types';
  import { cn } from '../../tools';
  import { usePasswordCopy } from './password-util.svelte';

  let { ref = $bindable(null), class: className, ...rest }: PasswordCopyButtonProps = $props();

  const state = usePasswordCopy();
</script>

<CopyButton
  {...rest}
  bind:ref
  text={state.root.passwordState.value}
  tabindex={-1}
  class={cn(
    'ui:text-muted-foreground ui:absolute ui:top-1/2 ui:right-0 ui:size-9 ui:min-w-0 ui:-translate-y-1/2 ui:hover:bg-transparent!',
    className
  )}
/>
