<script lang="ts">
  import { Drawer as DrawerPrimitive } from 'vaul-svelte';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: DrawerPrimitive.DescriptionProps = $props();
</script>

<DrawerPrimitive.Description
  bind:ref
  data-slot="drawer-description"
  class={cn('ui:text-muted-foreground ui:text-sm', className)}
  {...restProps}
/>
