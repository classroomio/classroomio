<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: NavigationMenuPrimitive.ContentProps = $props();
</script>

<NavigationMenuPrimitive.Content
  bind:ref
  data-slot="navigation-menu-content"
  class={cn(
    'ui:data-[motion^=from-]:animate-in ui:data-[motion^=to-]:animate-out ui:data-[motion^=from-]:fade-in ui:data-[motion^=to-]:fade-out ui:data-[motion=from-end]:slide-in-from-end-52 ui:data-[motion=from-start]:slide-in-from-start-52 ui:data-[motion=to-end]:slide-out-to-end-52 ui:data-[motion=to-start]:slide-out-to-start-52 ui:start-0 ui:top-0 ui:w-full md:ui:absolute md:ui:w-auto',
    'ui:group-data-[viewport=false]/navigation-menu:bg-popover ui:group-data-[viewport=false]/navigation-menu:text-popover-foreground ui:group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in ui:group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out ui:group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 ui:group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 ui:group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 ui:group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 ui:**:data-[slot=navigation-menu-link]:focus:ring-0 ui:**:data-[slot=navigation-menu-link]:focus:outline-none ui:group-data-[viewport=false]/navigation-menu:top-full ui:group-data-[viewport=false]/navigation-menu:mt-1.5 ui:group-data-[viewport=false]/navigation-menu:overflow-hidden ui:group-data-[viewport=false]/navigation-menu:rounded-md ui:group-data-[viewport=false]/navigation-menu:border ui:group-data-[viewport=false]/navigation-menu:shadow ui:group-data-[viewport=false]/navigation-menu:duration-200',
    className
  )}
  {...restProps}
/>
