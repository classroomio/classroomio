<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
  bind:ref
  data-slot="dialog-title"
<<<<<<< HEAD
  class={cn('text-lg font-semibold leading-none', className)}
=======
  class={cn('ui:text-lg ui:font-semibold ui:leading-none', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
