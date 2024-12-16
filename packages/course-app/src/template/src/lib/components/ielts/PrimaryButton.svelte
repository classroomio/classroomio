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
      'bg-ielts text-white font-semibold p-2 hover:bg-ielts',
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
  