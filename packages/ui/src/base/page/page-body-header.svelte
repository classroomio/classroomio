<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    align?: 'left' | 'right' | 'none';
  }

  let {
    ref = $bindable(null),
    class: className,
    children,
    align = 'right',
    ...restProps
  }: WithElementRef<Props> = $props();

  const alignClasses = $derived(
    {
      left: 'ui:justify-start',
      right: 'ui:justify-end',
      none: 'ui:justify-center'
    }[align]
  );
</script>

<div
  bind:this={ref}
  data-slot="page-body-header"
  class={cn('ui:flex ui:items-center ui:gap-2 ui:p-2', alignClasses, className)}
  {...restProps}
>
  {@render children?.()}
</div>
