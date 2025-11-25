<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLFieldsetAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLFieldsetAttributes> = $props();
</script>

<fieldset
  bind:this={ref}
  data-slot="field-set"
  class={cn(
    'ui:flex ui:flex-col ui:gap-6',
    'ui:has-[>[data-slot=checkbox-group]]:gap-3 ui:has-[>[data-slot=radio-group]]:gap-3',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</fieldset>
