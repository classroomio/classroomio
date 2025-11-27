<script lang="ts">
  import type { HTMLLiAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li
  bind:this={ref}
  data-slot="breadcrumb-item"
  class={cn('ui:inline-flex ui:items-center ui:gap-1.5', className)}
  {...restProps}
>
  {@render children?.()}
</li>
