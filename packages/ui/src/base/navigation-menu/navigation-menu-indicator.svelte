<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: NavigationMenuPrimitive.IndicatorProps = $props();
</script>

<NavigationMenuPrimitive.Indicator
  bind:ref
  data-slot="navigation-menu-indicator"
  class={cn(
    'data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden',
    className
  )}
  {...restProps}
>
  <div class="ui:bg-border ui:rounded-ts-sm ui:relative ui:top-[60%] ui:h-2 ui:w-2 ui:rotate-45 ui:shadow-md"></div>
</NavigationMenuPrimitive.Indicator>
