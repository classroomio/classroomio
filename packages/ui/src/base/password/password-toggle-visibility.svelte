<script lang="ts">
  import { Toggle } from '../toggle';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import { usePasswordToggleVisibility } from './password-util.svelte';
  import type { PasswordToggleVisibilityProps } from './types';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className }: PasswordToggleVisibilityProps = $props();

  const state = usePasswordToggleVisibility();
</script>

<Toggle
  bind:ref
  aria-label={state.root.opts.hidden.current ? 'Show password' : 'Hide password'}
  bind:pressed={state.root.opts.hidden.current}
  class={cn(
    'ui:data-[state=off]:text-muted-foreground ui:data-[state=on]:text-muted-foreground ui:hover:data-[state=off]:text-accent-foreground ui:hover:data-[state=on]:text-accent-foreground ui:absolute ui:top-1/2 ui:right-0 ui:size-9 ui:min-w-0 ui:-translate-y-1/2 ui:p-0 ui:hover:bg-transparent! ui:data-[state=on]:bg-transparent',
    {
      'ui:right-9 ui:max-w-6': state.root.passwordState.copyMounted
    },
    className
  )}
  tabindex={-1}
>
  {#if state.root.opts.hidden.current}
    <EyeIcon class="ui:size-4" />
  {:else}
    <EyeOffIcon class="ui:size-4" />
  {/if}
</Toggle>
