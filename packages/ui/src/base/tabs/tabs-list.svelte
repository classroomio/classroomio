<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
  bind:ref
  data-slot="tabs-list"
  class={cn(
    'ui:bg-muted ui:text-muted-foreground ui:inline-flex ui:h-9 ui:w-fit ui:items-center ui:justify-center ui:rounded-lg ui:p-[3px]',
    className
  )}
  {...restProps}
/>
