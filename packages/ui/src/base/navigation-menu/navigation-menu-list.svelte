<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: NavigationMenuPrimitive.ListProps = $props();
</script>

<NavigationMenuPrimitive.List
  bind:ref
  data-slot="navigation-menu-list"
  class={cn('ui:group ui:flex ui:flex-1 ui:list-none ui:items-center ui:justify-center ui:gap-1', className)}
  {...restProps}
/>
