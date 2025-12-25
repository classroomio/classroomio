<script lang="ts">
  import type { Separator as SeparatorPrimitive } from 'bits-ui';
  import { Separator } from '../separator';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: SeparatorPrimitive.RootProps = $props();
</script>

<Separator
  bind:ref
  data-slot="select-separator"
  class={cn('ui:bg-border ui:pointer-events-none ui:-mx-1 ui:my-1 ui:h-px', className)}
  {...restProps}
/>
