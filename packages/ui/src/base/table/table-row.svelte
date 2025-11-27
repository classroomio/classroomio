<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
  bind:this={ref}
  data-slot="table-row"
  class={cn(
    'ui:hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50 ui:data-[state=selected]:bg-muted ui:border-b ui:transition-colors',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</tr>
