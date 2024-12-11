<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils.js';

  interface Props {
    onClick: () => void;
    label: string | ChildNode;
    href?: string | undefined;
    class?: string | undefined;
    others?: any;
  }
  const { onClick, label, href, class: className, ...others }: Props = $props();
</script>

<Button
  {href}
  class={cn(
    'px-8 transition bg-white capitalize font-bold text-black ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] mb-4',
    className
  )}
  onclick={onClick}
  {others}
>
  {label}
</Button>
