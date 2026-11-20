<script lang="ts">
  import { Progress } from '../../base/progress';
  import { cn } from '../../tools';

  interface Props {
    value: number;
    compact?: boolean;
    class?: string;
  }

  let { value, compact = false, class: className }: Props = $props();

  const clamped = $derived(Math.max(0, Math.min(100, Math.round(value))));
</script>

<div class={cn('ui:flex ui:items-center ui:gap-2', compact ? 'ui:w-20' : 'ui:w-full', className)}>
  <Progress value={clamped} class="ui:rounded-full {compact ? 'ui:h-1.5' : 'ui:h-2'}" />
</div>
