<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils.js';

  interface Props {
    onClick?: () => void;
    label?: string;
    href?: string | undefined;
    class?: string | undefined;
    children?: any;
  }
  const { onClick, children, label, href, class: className, ...restProps }: Props = $props();
</script>

<div class="relative inline-block">
  <span
    class="absolute inset-0 -bottom-1 ring-1 ring-posthog bg-posthog-secondary rounded-md transition-transform duration-200 ease-in-out"
  ></span>
  <Button
    {href}
    class={cn(
      'bg-posthog hover:bg-posthog text-black ring-1 ring-posthog font-bold p-2 rounded-md relative z-10 transition-transform duration-200 ease-in-out hover:-translate-y-[2px]',
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
</div>
