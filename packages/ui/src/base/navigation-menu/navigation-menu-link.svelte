<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: NavigationMenuPrimitive.LinkProps = $props();
</script>

<NavigationMenuPrimitive.Link
  bind:ref
  data-slot="navigation-menu-link"
  class={cn(
    "ui:data-[active=true]:focus:bg-accent ui:data-[active=true]:hover:bg-accent ui:data-[active=true]:bg-accent/50 ui:data-[active=true]:text-accent-foreground ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:focus-visible:ring-ring/50 ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:flex ui:flex-col ui:gap-1 ui:rounded-sm ui:p-2 ui:text-sm ui:outline-none ui:transition-all ui:focus-visible:outline-1 ui:focus-visible:ring-[3px] ui:[&_svg:not([class*='size-'])]:size-4",
    className
  )}
  {...restProps}
/>
