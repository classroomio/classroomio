<script lang="ts">
  import { LinkPreview as HoverCardPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    align = 'center',
    sideOffset = 4,
    portalProps,
    ...restProps
  }: HoverCardPrimitive.ContentProps & {
    portalProps?: HoverCardPrimitive.PortalProps;
  } = $props();
</script>

<HoverCardPrimitive.Portal {...portalProps}>
  <HoverCardPrimitive.Content
    bind:ref
    data-slot="hover-card-content"
    {align}
    {sideOffset}
    class={cn(
      'ui:bg-popover ui:text-popover-foreground ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=open]:fade-in-0 ui:data-[state=closed]:zoom-out-95 ui:data-[state=open]:zoom-in-95 ui:data-[side=bottom]:slide-in-from-top-2 ui:data-[side=left]:slide-in-from-end-2 ui:data-[side=right]:slide-in-from-start-2 ui:data-[side=top]:slide-in-from-bottom-2 ui:outline-hidden ui:z-50 ui:mt-3 ui:w-64 ui:rounded-md ui:border ui:p-4 ui:shadow-md ui:outline-none',
      className
    )}
    {...restProps}
  />
</HoverCardPrimitive.Portal>
