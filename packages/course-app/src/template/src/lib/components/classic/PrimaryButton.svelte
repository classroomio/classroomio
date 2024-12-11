<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils.js';

  interface Props {
    onClick?: () => void;
    label: string;
    href?: string | undefined;
    class?: string | undefined;
    children?: any;
  }
  const { onClick, children, label, href, class: className, ...restProps }: Props = $props();
</script>

<Button
  {href}
  class={cn(
    'bg-[#CE02CE] rounded text-white font-semibold p-2 hover:scale-95 hover:bg-[#CE02CE] ',
    className
  )}
  onclick={onClick}
  {...restProps}
>
  {label}
  {#if children}
    {@render children?.()}
  {/if}
</Button>
