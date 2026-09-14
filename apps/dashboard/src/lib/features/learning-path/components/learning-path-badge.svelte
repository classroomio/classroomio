<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    type: 'path' | 'course';
    class?: string;
    /** Overlay on a colored cover — white-tinted glass instead of primary-tinted glass. */
    onCover?: boolean;
  }

  let { type, class: className, onCover = false }: Props = $props();
</script>

<Badge
  variant="outline"
  class={cn(
    'text-[10px] font-semibold tracking-[0.08em] uppercase backdrop-blur',
    onCover
      ? 'ui:border-white/30 ui:bg-white/15 ui:text-white'
      : 'ui:border-primary/25 ui:bg-primary/10 ui:text-primary',
    className
  )}
>
  {type === 'path' ? $t('learningPath.badge.learning_path') : $t('learningPath.badge.course')}
</Badge>
