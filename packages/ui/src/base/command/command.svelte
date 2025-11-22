<script lang="ts">
  import { cn } from '../../tools';
  import { Command as CommandPrimitive } from 'bits-ui';

  export type CommandRootApi = CommandPrimitive.Root;

  let {
    api = $bindable(null),
    ref = $bindable(null),
    value = $bindable(''),
    class: className,
    ...restProps
  }: CommandPrimitive.RootProps & {
    api?: CommandRootApi | null;
  } = $props();
</script>

<CommandPrimitive.Root
  bind:this={api}
  bind:value
  bind:ref
  data-slot="command"
  class={cn(
    'ui:bg-popover ui:text-popover-foreground ui:flex ui:h-full ui:w-full ui:flex-col ui:overflow-hidden ui:rounded-md',
    className
  )}
  {...restProps}
/>
