<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui';
  import SelectScrollUpButton from './select-scroll-up-button.svelte';
  import SelectScrollDownButton from './select-scroll-down-button.svelte';
  import { cn, type WithoutChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 4,
    portalProps,
    children,
    ...restProps
  }: WithoutChild<SelectPrimitive.ContentProps> & {
    portalProps?: SelectPrimitive.PortalProps;
  } = $props();
</script>

<SelectPrimitive.Portal {...portalProps}>
  <SelectPrimitive.Content
    bind:ref
    {sideOffset}
    data-slot="select-content"
    class={cn(
<<<<<<< HEAD
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-h-(--bits-select-content-available-height) origin-(--bits-select-content-transform-origin) relative z-50 min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border shadow-md data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
=======
      'ui:bg-popover ui:text-popover-foreground ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=open]:fade-in-0 ui:data-[state=closed]:zoom-out-95 ui:data-[state=open]:zoom-in-95 ui:data-[side=bottom]:slide-in-from-top-2 ui:data-[side=left]:slide-in-from-right-2 ui:data-[side=right]:slide-in-from-left-2 ui:data-[side=top]:slide-in-from-bottom-2 ui:max-h-(--bits-select-content-available-height) ui:origin-(--bits-select-content-transform-origin) ui:relative ui:z-50 ui:min-w-32 ui:overflow-y-auto ui:overflow-x-hidden ui:rounded-md ui:border ui:shadow-md ui:data-[side=bottom]:translate-y-1 ui:data-[side=left]:-translate-x-1 ui:data-[side=right]:translate-x-1 ui:data-[side=top]:-translate-y-1',
>>>>>>> feat/release-v2
      className
    )}
    {...restProps}
  >
    <SelectScrollUpButton />
    <SelectPrimitive.Viewport
<<<<<<< HEAD
      class={cn('h-(--bits-select-anchor-height) min-w-(--bits-select-anchor-width) w-full scroll-my-1 p-1')}
=======
      class={cn(
        'ui:h-(--bits-select-anchor-height) ui:min-w-(--bits-select-anchor-width) ui:w-full ui:scroll-my-1 ui:p-1'
      )}
>>>>>>> feat/release-v2
    >
      {@render children?.()}
    </SelectPrimitive.Viewport>
    <SelectScrollDownButton />
  </SelectPrimitive.Content>
</SelectPrimitive.Portal>
