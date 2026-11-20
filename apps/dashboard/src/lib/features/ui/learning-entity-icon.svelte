<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import { ContentType } from '@cio/utils/constants/content';
  import { CourseIcon, LessonIcon, ExerciseIcon, PathIcon } from '@cio/ui/custom/moving-icons';
  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';

  import type { Component } from 'svelte';

  export type LearningEntityType = 'path' | 'course' | 'section' | 'lesson' | 'exercise';
  export type LearningEntity = LearningEntityType | ContentType;

  interface Props {
    type: LearningEntity;
    size?: number;
    className?: string;
    isHovered?: boolean;
    colored?: boolean;
  }

  let { type, size = 14, className = '', isHovered = false, colored = true }: Props = $props();

  const normalizedType = $derived(typeof type === 'string' ? type.toLowerCase() : type);

  type IconComponent = Component<{ size?: number; class?: string; isHovered?: boolean }>;

  const iconByType: Record<string, IconComponent> = {
    path: PathIcon as IconComponent,
    course: CourseIcon as IconComponent,
    section: TableOfContentsIcon as unknown as IconComponent,
    lesson: LessonIcon as IconComponent,
    exercise: ExerciseIcon as IconComponent
  };

  const colorByType: Record<string, string> = {
    path: 'text-primary dark:text-primary',
    course: 'text-violet-600 dark:text-violet-400',
    section: '',
    lesson: 'text-sky-600 dark:text-sky-400',
    exercise: 'text-green-600 dark:text-green-400'
  };

  const Icon = $derived(iconByType[normalizedType] ?? CourseIcon);
  const hasCustomTextColor = $derived(/(?:^|\s)(?:ui:)?text-/.test(className));
  const shouldColor = $derived(colored && !hasCustomTextColor);
  const colorClass = $derived(shouldColor ? (colorByType[normalizedType] ?? '') : '');
  const iconClass = $derived(cn('shrink-0 custom [&>svg]:size-full', colorClass, className));
</script>

<Icon {size} class={iconClass} {isHovered} />
