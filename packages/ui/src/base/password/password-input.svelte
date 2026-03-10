<script lang="ts">
  import { cn } from '../../tools';
  import { box, mergeProps } from 'svelte-toolbelt';
  import { usePasswordInput } from './password-util.svelte';
  import type { PasswordInputProps } from './types';
  import { Input } from '../input';

  let {
    ref = $bindable(null),
    value = $bindable(''),
    class: className,
    children,
    ...rest
  }: PasswordInputProps = $props();

  const state = usePasswordInput({
    value: box.with(
      () => value,
      (v) => (value = v)
    ),
    ref: box.with(() => ref)
  });

  const mergedProps = $derived(mergeProps(rest, state.props));
</script>

<div class="ui:relative">
  <Input
    {...mergedProps}
    bind:value
    bind:ref
    type={state.root.opts.hidden.current ? 'password' : 'text'}
    class={cn(
      'ui:transition-all',
      {
        // either or is mounted (offset 36px)
        'ui:pr-9': state.root.passwordState.copyMounted || state.root.passwordState.toggleMounted,
        // both are mounted (offset 36px * 2)
        'ui:pr-18': state.root.passwordState.copyMounted && state.root.passwordState.toggleMounted
      },
      className
    )}
  />
  {@render children?.()}
</div>
