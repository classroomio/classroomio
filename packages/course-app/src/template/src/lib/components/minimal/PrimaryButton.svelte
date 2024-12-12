<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils.js';

  interface Props {
    onClick?: () => void;
    label?: string;
    href?: string;
    class?: string;
    children?: any;
  }
  const { onClick, children, label, href, class: className, ...restProps }: Props = $props();
</script>

<Button
  {href}
  onclick={onClick}
  class={cn(
    'rounded-none uppercase bg-minimal hover:bg-minimal p-3 hover:scale-95 font-bold',
    className
  )}
  {...restProps}
>
  {label}
  {#if children}
    {@render children?.()}
  {/if}
</Button>
