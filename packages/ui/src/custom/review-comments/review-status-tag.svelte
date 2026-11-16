<script lang="ts">
  import { cn } from '../../tools';
  import type { ReviewStatusTagVariant } from './types';

  interface Props {
    variant: ReviewStatusTagVariant;
    label: string;
    /** Extra explanation shown on hover, e.g. why a member is marked as former. */
    title?: string;
    class?: string;
  }

  let { variant, label, title, class: className }: Props = $props();

  const VARIANT_CLASSES: Record<ReviewStatusTagVariant, string> = {
    removed: 'ui:bg-amber-100 ui:text-amber-800 ui:dark:bg-amber-500/15 ui:dark:text-amber-300',
    resolved: 'ui:bg-success/10 ui:text-success',
    new: 'ui:bg-primary ui:text-primary-foreground',
    former_member: 'ui:rounded-full ui:border ui:border-border ui:bg-muted ui:text-muted-foreground',
    pinned: 'ui:bg-muted ui:text-muted-foreground',
    neutral: 'ui:bg-muted ui:text-muted-foreground'
  };
</script>

<span
  data-slot="review-status-tag"
  {title}
  class={cn(
    'ui:inline-flex ui:items-center ui:rounded-md ui:px-1.5 ui:py-px ui:text-[11px] ui:font-medium',
    VARIANT_CLASSES[variant],
    className
  )}
>
  {label}
</span>
