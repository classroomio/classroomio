<script lang="ts">
  import { Command as CommandPrimitive, useId } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    heading,
    value,
    ...restProps
  }: CommandPrimitive.GroupProps & {
    heading?: string;
  } = $props();
</script>

<CommandPrimitive.Group
  bind:ref
  data-slot="command-group"
<<<<<<< HEAD
  class={cn('text-foreground overflow-hidden p-1', className)}
=======
  class={cn('ui:text-foreground ui:overflow-hidden ui:p-1', className)}
>>>>>>> feat/release-v2
  value={value ?? heading ?? `----${useId()}`}
  {...restProps}
>
  {#if heading}
<<<<<<< HEAD
    <CommandPrimitive.GroupHeading class="text-muted-foreground px-2 py-1.5 text-xs font-medium">
=======
    <CommandPrimitive.GroupHeading class="ui:text-muted-foreground ui:px-2 ui:py-1.5 ui:text-xs ui:font-medium">
>>>>>>> feat/release-v2
      {heading}
    </CommandPrimitive.GroupHeading>
  {/if}
  <CommandPrimitive.GroupItems {children} />
</CommandPrimitive.Group>
