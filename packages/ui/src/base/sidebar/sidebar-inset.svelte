<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<main
  bind:this={ref}
  data-slot="sidebar-inset"
  class={cn(
    'ui:bg-background ui:relative ui:flex ui:w-full ui:flex-1 ui:flex-col ui:h-full',
    'ui:md:peer-data-[variant=inset]:m-2 ui:md:peer-data-[variant=inset]:ml-0 ui:md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 ui:md:peer-data-[variant=inset]:rounded-xl ui:md:peer-data-[variant=inset]:shadow-sm',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</main>
