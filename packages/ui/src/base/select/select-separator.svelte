<script lang="ts">
  import type { Separator as SeparatorPrimitive } from 'bits-ui';
  import { Separator } from '../separator';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: SeparatorPrimitive.RootProps = $props();
</script>

<Separator
  bind:ref
  data-slot="select-separator"
<<<<<<< HEAD
  class={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
=======
  class={cn('ui:bg-border ui:pointer-events-none ui:-mx-1 ui:my-1 ui:h-px', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
