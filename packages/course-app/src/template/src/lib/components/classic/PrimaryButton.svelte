<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils.js';

  interface Props {
    onClick: () => void;
    label: string;
    href?: string | undefined;
    class?: string | undefined;
  }
  const { onClick, label, href, class: className }: Props = $props();
</script>

<Button
  {href}
  class={cn('bg-[#CE02CE] rounded text-white font-semibold p-2 hover:scale-95', className)}
  onclick={onClick}
>
  {label}
</Button>
