<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import { cn } from '../../../src/tools';

  let { ref = $bindable(null), class: className, ...restProps }: SheetPrimitive.OverlayProps = $props();
</script>

<SheetPrimitive.Overlay
  bind:ref
  data-slot="sheet-overlay"
  class={cn(
    'ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=open]:fade-in-0 ui:fixed ui:inset-0 ui:z-50 ui:bg-black/50',
    className
  )}
  {...restProps}
/>
