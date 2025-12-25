<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLLiAttributes } from 'svelte/elements';

  let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li
  bind:this={ref}
  data-slot="breadcrumb-separator"
  role="presentation"
  aria-hidden="true"
  class={cn('ui:[&>svg]:size-3.5', className)}
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    <ChevronRightIcon />
  {/if}
</li>
