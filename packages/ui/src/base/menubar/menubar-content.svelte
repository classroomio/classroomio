<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 8,
    alignOffset = -4,
    align = 'start',
    side = 'bottom',
    portalProps,
    ...restProps
  }: MenubarPrimitive.ContentProps & {
    portalProps?: MenubarPrimitive.PortalProps;
  } = $props();
</script>

<MenubarPrimitive.Portal {...portalProps}>
  <MenubarPrimitive.Content
    bind:ref
    data-slot="menubar-content"
    {sideOffset}
    {align}
    {alignOffset}
    {side}
    class={cn(
      'ui:bg-popover ui:text-popover-foreground ui:data-[state=open]:animate-in ui:data-[state=closed]:fade-out-0 ui:data-[state=open]:fade-in-0 ui:data-[state=closed]:zoom-out-95 ui:data-[state=open]:zoom-in-95 ui:data-[side=bottom]:slide-in-from-top-2 ui:data-[side=left]:slide-in-from-right-2 ui:data-[side=right]:slide-in-from-left-2 ui:data-[side=top]:slide-in-from-bottom-2 ui:origin-(--bits-menubar-content-transform-origin) ui:z-50 ui:min-w-48 ui:overflow-hidden ui:rounded-md ui:border ui:p-1 ui:shadow-md',
      className
    )}
    {...restProps}
  />
</MenubarPrimitive.Portal>
