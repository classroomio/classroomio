<script lang="ts">
  import { Badge } from '../../base/badge';
  import { cn } from '../../tools';

  interface Props {
    value?: number | string;
    className?: string;
  }

  let { value = 0, className = '' }: Props = $props();
</script>

<Badge class={cn('h-5 min-w-5 rounded-full px-1 font-mono tabular-nums', className)} variant="outline">
  {value}
</Badge>
