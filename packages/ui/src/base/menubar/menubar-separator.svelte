<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: MenubarPrimitive.SeparatorProps = $props();
</script>

<MenubarPrimitive.Separator
  bind:ref
  data-slot="menubar-separator"
<<<<<<< HEAD
  class={cn('bg-border -mx-1 my-1 h-px', className)}
=======
  class={cn('ui:bg-border ui:-mx-1 ui:my-1 ui:h-px', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
