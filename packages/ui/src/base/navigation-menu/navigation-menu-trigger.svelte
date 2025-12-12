<script lang="ts" module>
  import { cn } from '../../tools';
  import { tv } from 'tailwind-variants';

  export const navigationMenuTriggerStyle = tv({
    base: 'ui:bg-background ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground data-[state=open]:ui:hover:bg-accent data-[state=open]:ui:text-accent-foreground data-[state=open]:ui:focus:bg-accent data-[state=open]:ui:bg-accent/50 ui:focus-visible:ring-ring/50 ui:group ui:inline-flex ui:h-9 ui:w-max ui:items-center ui:justify-center ui:rounded-md ui:px-4 ui:py-2 ui:text-sm ui:font-medium ui:outline-none ui:transition-[color,box-shadow] ui:focus-visible:outline-1 ui:focus-visible:ring-[3px] ui:disabled:pointer-events-none ui:disabled:opacity-50'
  });
</script>

<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: NavigationMenuPrimitive.TriggerProps = $props();
</script>

<NavigationMenuPrimitive.Trigger
  bind:ref
  data-slot="navigation-menu-trigger"
  class={cn(navigationMenuTriggerStyle(), 'ui:group', className)}
  {...restProps}
>
  {@render children?.()}

  <ChevronDownIcon
    class="ui:relative ui:top-px ui:ms-1 ui:size-3 ui:transition ui:duration-300 group-data-[state=open]:ui:rotate-180"
    aria-hidden="true"
  />
</NavigationMenuPrimitive.Trigger>
