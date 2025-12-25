<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import { cn } from '../../../src/tools';

  let { ref = $bindable(null), class: className, ...restProps }: SheetPrimitive.TitleProps = $props();
</script>

<SheetPrimitive.Title
  bind:ref
  data-slot="sheet-title"
  class={cn('ui:text-foreground ui:font-semibold', className)}
  {...restProps}
/>
