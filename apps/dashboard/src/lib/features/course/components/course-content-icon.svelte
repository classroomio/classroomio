<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import { ContentType } from '@cio/utils/constants/content';
  import { CONTENT_DEFINITIONS } from '$features/course/utils/content';

  interface Props {
    type: ContentType;
    size?: number;
    className?: string;
    isHovered?: boolean;
  }

  const iconColorClassByType = {
    // For now, I don't think sections need a different color. If there is a good reason for it, we can uncomment this.
    // [ContentType.Section]: 'text-violet-600 dark:text-violet-400',
    [ContentType.Lesson]: 'text-sky-600 dark:text-sky-400',
    [ContentType.Exercise]: 'text-green-600 dark:text-green-400'
  } as const;

  let { type, size = 14, className = '', isHovered = false }: Props = $props();
  const Icon = $derived(CONTENT_DEFINITIONS[type].icon);
  const iconClass = $derived(cn('shrink-0 custom', iconColorClassByType[type], className));
</script>

<Icon {size} class={iconClass} {isHovered} />
