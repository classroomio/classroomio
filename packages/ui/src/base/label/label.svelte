<script lang="ts">
  import { Label as LabelPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: LabelPrimitive.RootProps = $props();
</script>

<LabelPrimitive.Root
  bind:ref
  data-slot="label"
  class={cn(
    'ui:flex ui:select-none ui:items-center ui:gap-2 ui:text-sm ui:font-medium ui:leading-none ui:peer-disabled:cursor-not-allowed ui:peer-disabled:opacity-50 ui:group-data-[disabled=true]:pointer-events-none ui:group-data-[disabled=true]:opacity-50',
    className
  )}
  {...restProps}
/>
