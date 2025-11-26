<script lang="ts">
  import { Drawer as DrawerPrimitive } from 'vaul-svelte';
  import DrawerOverlay from './drawer-overlay.svelte';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    portalProps,
    children,
    ...restProps
  }: DrawerPrimitive.ContentProps & {
    portalProps?: DrawerPrimitive.PortalProps;
  } = $props();
</script>

<DrawerPrimitive.Portal {...portalProps}>
  <DrawerOverlay />
  <DrawerPrimitive.Content
    bind:ref
    data-slot="drawer-content"
    class={cn(
      'ui:group/drawer-content ui:bg-background ui:fixed ui:z-50 ui:flex ui:h-auto ui:flex-col',
      'ui:data-[vaul-drawer-direction=top]:inset-x-0 ui:data-[vaul-drawer-direction=top]:top-0 ui:data-[vaul-drawer-direction=top]:mb-24 ui:data-[vaul-drawer-direction=top]:max-h-[80vh] ui:data-[vaul-drawer-direction=top]:rounded-b-lg ui:data-[vaul-drawer-direction=top]:border-b',
      'ui:data-[vaul-drawer-direction=bottom]:inset-x-0 ui:data-[vaul-drawer-direction=bottom]:bottom-0 ui:data-[vaul-drawer-direction=bottom]:mt-24 ui:data-[vaul-drawer-direction=bottom]:max-h-[80vh] ui:data-[vaul-drawer-direction=bottom]:rounded-t-lg ui:data-[vaul-drawer-direction=bottom]:border-t',
      'ui:data-[vaul-drawer-direction=right]:inset-y-0 ui:data-[vaul-drawer-direction=right]:end-0 ui:data-[vaul-drawer-direction=right]:w-3/4 ui:data-[vaul-drawer-direction=right]:border-s ui:data-[vaul-drawer-direction=right]:sm:max-w-sm',
      'ui:data-[vaul-drawer-direction=left]:inset-y-0 ui:data-[vaul-drawer-direction=left]:start-0 ui:data-[vaul-drawer-direction=left]:w-3/4 ui:data-[vaul-drawer-direction=left]:border-e ui:data-[vaul-drawer-direction=left]:sm:max-w-sm',
      className
    )}
    {...restProps}
  >
    <div
      class="ui:bg-muted ui:mx-auto ui:mt-4 ui:hidden ui:h-2 ui:w-[100px] ui:shrink-0 ui:rounded-full ui:group-data-[vaul-drawer-direction=bottom]/drawer-content:block"
    ></div>
    {@render children?.()}
  </DrawerPrimitive.Content>
</DrawerPrimitive.Portal>
