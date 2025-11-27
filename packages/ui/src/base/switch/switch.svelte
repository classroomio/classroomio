<script lang="ts">
  import { Switch as SwitchPrimitive } from 'bits-ui';
  import { cn, type WithoutChildrenOrChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    ...restProps
  }: WithoutChildrenOrChild<SwitchPrimitive.RootProps> = $props();
</script>

<SwitchPrimitive.Root
  bind:ref
  bind:checked
  data-slot="switch"
  class={cn(
    'ui:data-[state=checked]:bg-primary ui:data-[state=unchecked]:bg-input ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:dark:data-[state=unchecked]:bg-input/80 ui:shadow-xs ui:inline-flex ui:h-[1.15rem] ui:w-8 ui:shrink-0 ui:items-center ui:rounded-full ui:border ui:border-transparent ui:outline-none ui:transition-all ui:focus-visible:ring-[3px] ui:disabled:cursor-not-allowed ui:disabled:opacity-50 peer',
    className
  )}
  {...restProps}
>
  <SwitchPrimitive.Thumb
    data-slot="switch-thumb"
    class={cn(
      'ui:bg-background ui:dark:data-[state=unchecked]:bg-foreground ui:dark:data-[state=checked]:bg-primary-foreground ui:pointer-events-none ui:block ui:size-4 ui:rounded-full ui:ring-0 ui:transition-transform ui:data-[state=checked]:translate-x-[calc(100%-2px)] ui:data-[state=unchecked]:translate-x-0'
    )}
  />
</SwitchPrimitive.Root>
