<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: NavigationMenuPrimitive.ViewportProps = $props();
</script>

<div class={cn('ui:absolute ui:start-0 ui:top-full ui:isolate ui:z-50 ui:flex ui:justify-center')}>
  <NavigationMenuPrimitive.Viewport
    bind:ref
    data-slot="navigation-menu-viewport"
    class={cn(
      'ui:origin-top-center ui:bg-popover ui:text-popover-foreground ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:data-[state=closed]:zoom-out-95 ui:data-[state=open]:zoom-in-90 ui:relative ui:mt-1.5 ui:h-(--bits-navigation-menu-viewport-height) ui:w-full ui:overflow-hidden ui:rounded-md ui:border ui:shadow md:ui:w-[var(--bits-navigation-menu-viewport-width)]',
      className
    )}
    {...restProps}
  />
</div>
