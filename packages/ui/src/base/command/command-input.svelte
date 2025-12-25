<script lang="ts">
  import { Command as CommandPrimitive } from 'bits-ui';
  import SearchIcon from '@lucide/svelte/icons/search';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    value = $bindable(''),
    ...restProps
  }: CommandPrimitive.InputProps = $props();
</script>

<div class="ui:flex ui:h-9 ui:items-center ui:gap-2 ui:border-b ui:pl-3 ui:pr-8" data-slot="command-input-wrapper">
  <SearchIcon class="ui:size-4 ui:shrink-0 ui:opacity-50" />
  <CommandPrimitive.Input
    data-slot="command-input"
    class={cn(
      'ui:placeholder:text-muted-foreground ui:outline-hidden ui:flex ui:h-10 ui:w-full ui:rounded-md ui:bg-transparent ui:py-3 ui:text-sm ui:disabled:cursor-not-allowed ui:disabled:opacity-50',
      className
    )}
    bind:ref
    {...restProps}
    bind:value
  />
</div>
