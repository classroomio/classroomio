<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import { cn } from '@cio/ui/tools';

  interface Props {
    value: number;
    compact?: boolean;
    class?: string;
  }

  let { value, compact = false, class: className }: Props = $props();

  const clamped = $derived(Math.max(0, Math.min(100, Math.round(value))));
</script>

<div class={cn(compact ? 'w-20' : 'w-full', 'flex items-center gap-2', className)}>
  <Progress value={clamped} class="rounded-full {compact ? 'h-1.5' : 'h-2'}" />
</div>
