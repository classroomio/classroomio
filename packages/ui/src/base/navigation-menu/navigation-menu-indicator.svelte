<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: NavigationMenuPrimitive.IndicatorProps = $props();
</script>

<NavigationMenuPrimitive.Indicator
  bind:ref
  data-slot="navigation-menu-indicator"
  class={cn(
    'ui:data-[state=visible]:animate-in ui:data-[state=hidden]:animate-out ui:data-[state=hidden]:fade-out ui:data-[state=visible]:fade-in ui:top-full ui:z-[1] ui:flex ui:h-1.5 ui:items-end ui:justify-center ui:overflow-hidden',
    className
  )}
  {...restProps}
>
  <div class="ui:bg-border ui:rounded-ts-sm ui:relative ui:top-[60%] ui:h-2 ui:w-2 ui:rotate-45 ui:shadow-md"></div>
</NavigationMenuPrimitive.Indicator>
