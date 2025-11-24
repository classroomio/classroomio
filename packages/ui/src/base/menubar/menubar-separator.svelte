<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: MenubarPrimitive.SeparatorProps = $props();
</script>

<MenubarPrimitive.Separator
  bind:ref
  data-slot="menubar-separator"
  class={cn('ui:bg-border ui:-mx-1 ui:my-1 ui:h-px', className)}
  {...restProps}
/>
