<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
  import { cn } from '../../tools';
  import NavigationMenuViewport from './navigation-menu-viewport.svelte';

  let {
    ref = $bindable(null),
    class: className,
    viewport = true,
    children,
    ...restProps
  }: NavigationMenuPrimitive.RootProps & {
    viewport?: boolean;
  } = $props();
</script>

<NavigationMenuPrimitive.Root
  bind:ref
  data-slot="navigation-menu"
  data-viewport={viewport}
  class={cn(
    'ui:group/navigation-menu ui:relative ui:flex ui:max-w-max ui:flex-1 ui:items-center ui:justify-center',
    className
  )}
  {...restProps}
>
  {@render children?.()}

  {#if viewport}
    <NavigationMenuViewport />
  {/if}
</NavigationMenuPrimitive.Root>
