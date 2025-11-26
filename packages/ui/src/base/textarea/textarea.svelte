<script lang="ts">
  import { cn, type WithElementRef, type WithoutChildren } from '../../tools';
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className,
    'data-slot': dataSlot = 'textarea',
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
  bind:this={ref}
  data-slot={dataSlot}
  class={cn(
    'ui:border-input ui:placeholder:text-muted-foreground ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:dark:bg-input/30 ui:field-sizing-content ui:shadow-xs ui:flex ui:min-h-16 ui:w-full ui:rounded-md ui:border ui:bg-transparent ui:px-3 ui:py-2 ui:text-base ui:outline-none ui:transition-[color,box-shadow] ui:focus-visible:ring-[3px] ui:disabled:cursor-not-allowed ui:disabled:opacity-50 ui:md:text-sm',
    className
  )}
  bind:value
  {...restProps}
></textarea>
