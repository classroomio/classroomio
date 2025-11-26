<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    href = undefined,
    child,
    children,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    child?: Snippet<[{ props: HTMLAnchorAttributes }]>;
  } = $props();

  const attrs = $derived({
    'data-slot': 'breadcrumb-link',
<<<<<<< HEAD
    class: cn('hover:text-foreground transition-colors', className),
=======
    class: cn('ui:hover:text-foreground ui:transition-colors', className),
>>>>>>> feat/release-v2
    href,
    ...restProps
  });
</script>

{#if child}
  {@render child({ props: attrs })}
{:else}
  <a bind:this={ref} {...attrs}>
    {@render children?.()}
  </a>
{/if}
