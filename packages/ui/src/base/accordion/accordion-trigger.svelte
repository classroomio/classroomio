<script lang="ts">
  import { Accordion as AccordionPrimitive } from 'bits-ui';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { cn, type WithoutChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    level = 3,
    children,
    ...restProps
  }: WithoutChild<AccordionPrimitive.TriggerProps> & {
    level?: AccordionPrimitive.HeaderProps['level'];
  } = $props();
</script>

<AccordionPrimitive.Header {level} class="ui:flex">
  <AccordionPrimitive.Trigger
    data-slot="accordion-trigger"
    bind:ref
    class={cn(
      'ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:flex ui:flex-1 ui:items-start ui:justify-between ui:gap-4 ui:rounded-md ui:py-4 ui:text-left ui:text-sm ui:font-medium ui:outline-none ui:transition-all ui:hover:underline ui:focus-visible:ring-[3px] ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:[&[data-state=open]>svg]:rotate-180',
      className
    )}
    {...restProps}
  >
    {@render children?.()}
    <ChevronDownIcon
      class="ui:text-muted-foreground ui:pointer-events-none ui:size-4 ui:shrink-0 ui:translate-y-0.5 ui:transition-transform ui:duration-200"
    />
  </AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
