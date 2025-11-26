<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: DialogPrimitive.DescriptionProps = $props();
</script>

<DialogPrimitive.Description
  bind:ref
  data-slot="dialog-description"
<<<<<<< HEAD
  class={cn('text-muted-foreground text-sm', className)}
=======
  class={cn('ui:text-muted-foreground ui:text-sm', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
