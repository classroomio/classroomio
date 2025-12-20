<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
  bind:ref
  data-slot="tabs-trigger"
  class={cn(
    "ui:data-[state=active]:bg-background ui:dark:data-[state=active]:text-foreground ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:focus-visible:outline-ring ui:dark:data-[state=active]:border-input ui:dark:data-[state=active]:bg-input/30 ui:text-foreground ui:dark:text-muted-foreground ui:inline-flex ui:h-[calc(100%-1px)] ui:flex-1 ui:items-center ui:justify-center ui:gap-1.5 ui:whitespace-nowrap ui:rounded-md ui:border ui:border-transparent ui:px-2 ui:py-1 ui:text-sm ui:font-medium ui:transition-[color,box-shadow] ui:focus-visible:outline-1 ui:focus-visible:ring-[3px] ui:data-disabled:pointer-events-none ui:data-disabled:opacity-50 ui:data-[state=active]:shadow-sm ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:cursor-pointer",
    className
  )}
  {...restProps}
/>
