<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

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
  class={cn('group bg-vercel hover:bg-vercel rounded text-white gap-6', className)}
  {...restProps}
>
  {label}
  {#if children}
    {@render children?.()}
  {/if}
</Button>
