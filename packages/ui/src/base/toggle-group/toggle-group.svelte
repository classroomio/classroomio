<script lang="ts" module>
  export type ToggleGroupSpacing = 0 | 1 | 2 | 3 | 4;
</script>

<script lang="ts">
  import { setContext } from 'svelte';
  import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
  import { cn } from '../../tools';
  import { TOGGLE_GROUP_CONTEXT, type ToggleGroupContextValue } from './toggle-group-context';
  import type { ToggleGroupItemSize, ToggleGroupItemVariant } from './toggle-group-item.svelte';

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className,
    variant = 'default',
    size = 'default',
    spacing = 1,
    ...restProps
  }: ToggleGroupPrimitive.RootProps<'single' | 'multiple'> & {
    variant?: ToggleGroupItemVariant;
    size?: ToggleGroupItemSize;
    spacing?: ToggleGroupSpacing;
  } = $props();

  setContext<ToggleGroupContextValue>(TOGGLE_GROUP_CONTEXT, {
    getVariant: () => variant,
    getSize: () => size
  });

  const spacingClassName = $derived.by(() => {
    switch (spacing) {
      case 0:
        return 'ui:gap-0';
      case 2:
        return 'ui:gap-2';
      case 3:
        return 'ui:gap-3';
      case 4:
        return 'ui:gap-4';
      case 1:
      default:
        return 'ui:gap-1';
    }
  });
</script>

<ToggleGroupPrimitive.Root
  bind:ref
  bind:value
  data-slot="toggle-group"
  class={cn('ui:flex ui:w-fit ui:items-center ui:justify-center', spacingClassName, className)}
  {...restProps}
/>
