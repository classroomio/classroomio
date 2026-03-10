<script lang="ts">
  import { Badge } from '../../base/badge';
  import { cn } from '../../tools';

  interface Props {
    value?: number | string;
    className?: string;
  }

  let { value = 0, className = '' }: Props = $props();
</script>

<Badge class={cn('ui:h-5 ui:min-w-5 ui:rounded-full ui:px-1 ui:font-mono tabular-nums', className)} variant="outline">
  {value}
</Badge>
