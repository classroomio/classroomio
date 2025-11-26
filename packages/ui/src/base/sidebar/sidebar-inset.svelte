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
<<<<<<< HEAD
    'bg-background relative flex w-full flex-1 flex-col',
    'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm',
=======
    'ui:bg-background ui:relative ui:flex ui:w-full ui:flex-1 ui:flex-col',
    'ui:md:peer-data-[variant=inset]:m-2 ui:md:peer-data-[variant=inset]:ml-0 ui:md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 ui:md:peer-data-[variant=inset]:rounded-xl ui:md:peer-data-[variant=inset]:shadow-sm',
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
>
  {@render children?.()}
</main>
