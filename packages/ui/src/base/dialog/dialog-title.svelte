<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, child, children, ...restProps }: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
  bind:ref
  data-slot="dialog-title"
  class={cn('ui:text-lg ui:font-semibold ui:leading-none', className)}
  {child}
  {...restProps}
>
  {@render children?.()}
</DialogPrimitive.Title>
