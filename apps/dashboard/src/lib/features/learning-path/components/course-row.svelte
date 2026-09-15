<script lang="ts">
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import CheckSquareIcon from '@lucide/svelte/icons/check-square';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathCourseItem } from '../utils/types';

  interface Props {
    course: LearningPathCourseItem;
    reorder?: boolean;
    onRemove: (course: LearningPathCourseItem) => void;
  }

  let { course, reorder = false, onRemove }: Props = $props();

  const metaChipClass =
    'ui:bg-muted ui:text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]';
</script>

<div
  class="ui:border-border ui:bg-card ui:text-card-foreground hover:ui:border-ring/50 flex items-center gap-3 rounded-lg border p-3 transition {reorder
    ? 'cursor-grab active:cursor-grabbing'
    : ''}"
>
  <!-- Drag Grip Handle (only visible in reorder mode) -->
  {#if reorder}
    <span
      class="ui:text-muted-foreground hover:ui:text-foreground cursor-grab transition active:cursor-grabbing"
      aria-label={$t('learningPath.builder.drag_hint')}
    >
      <GripVerticalIcon class="size-4" />
    </span>
  {/if}

  <!-- Order Number Badge -->
  <span
    class="ui:bg-primary/10 ui:text-primary flex size-6 shrink-0 items-center justify-center rounded text-xs font-semibold tabular-nums"
  >
    {course.order}
  </span>

  <!-- Course Info -->
  <div class="min-w-0 flex-1">
    <a
      href={`/courses/${course.courseId}`}
      target="_blank"
      rel="noopener noreferrer"
      class="ui:text-foreground truncate text-sm font-medium hover:underline"
    >
      {course.title}
    </a>

    <div class="mt-1 flex flex-wrap items-center gap-2">
      <span class={metaChipClass}>
        <FileTextIcon class="size-3" />
        {course.lessonsCount}
        {course.lessonsCount === 1 ? 'lesson' : 'lessons'}
      </span>

      <span class={metaChipClass}>
        <CheckSquareIcon class="size-3" />
        {course.exercisesCount}
        {course.exercisesCount === 1 ? 'exercise' : 'exercises'}
      </span>

      <span class={metaChipClass}>
        {course.cost > 0 ? `$${course.cost}` : 'Free'}
      </span>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex shrink-0 items-center gap-1">
    <Button
      href={`/courses/${course.courseId}`}
      target="_blank"
      rel="noopener noreferrer"
      variant="ghost"
      size="icon"
      class="ui:text-muted-foreground hover:ui:text-foreground size-8"
      title={$t('learningPath.builder.open_course')}
      aria-label={$t('learningPath.builder.open_course')}
    >
      <ExternalLinkIcon class="size-4" />
    </Button>

    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="ui:text-muted-foreground hover:ui:bg-destructive/10 hover:ui:text-destructive size-8"
      title={$t('learningPath.builder.remove_course')}
      aria-label={$t('learningPath.builder.remove_course')}
      onclick={() => onRemove(course)}
    >
      <Trash2Icon class="size-4" />
    </Button>
  </div>
</div>
