<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    required: boolean;
    class?: string;
  }

  let { required, class: className = '' }: Props = $props();
</script>

<span
  data-testid={required ? 'lessons-requirement-chip-required' : 'lessons-requirement-chip-optional'}
  class={cn(
    'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
    required
      ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
      : 'border border-dashed border-gray-300 font-medium text-gray-500 dark:border-neutral-600 dark:text-gray-400',
    className
  )}
>
  {required ? $t('course.navItem.lessons.requirement.required') : $t('course.navItem.lessons.requirement.optional')}
</span>
