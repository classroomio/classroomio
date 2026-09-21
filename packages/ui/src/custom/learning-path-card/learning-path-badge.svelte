<script lang="ts">
  import { Badge } from '../../base/badge';
  import { cn } from '../../tools';

  interface Props {
    label: string;
    class?: string;
    /** Overlay on a colored cover — white-tinted glass instead of primary-tinted glass. */
    onCover?: boolean;
  }

  let { label, class: className, onCover = false }: Props = $props();
</script>

<Badge
  variant="outline"
  class={cn(
    'ui:text-[10px] ui:font-semibold ui:tracking-[0.08em] ui:uppercase ui:backdrop-blur ui:rounded-md',
    onCover
      ? 'ui:border-white/30 ui:bg-white/15 ui:text-white'
      : 'ui:border-primary/30 ui:bg-primary/10 ui:text-primary',
    className
  )}
>
  {label}
</Badge>
