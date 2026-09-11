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
    onRemove: (course: LearningPathCourseItem) => void;
  }

  let { course, onRemove }: Props = $props();

  const gradient = $derived(
    course.thumbnailGradient || 'linear-gradient(135deg, oklch(0.705 0.213 47.604), oklch(0.75 0.183 55.934))'
  );
</script>

<div
  class="group border-border bg-card hover:border-ring flex items-center gap-3 rounded-lg border p-3.5 transition hover:shadow-xs"
>
  <!-- Drag Grip Handle -->
  <span
    class="text-muted-foreground hover:text-foreground cursor-grab transition active:cursor-grabbing"
    aria-label={$t('learningPath.builder.drag_hint')}
  >
    <GripVerticalIcon class="size-4" />
  </span>

  <!-- Order Number Badge -->
  <span
    class="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums"
  >
    {course.order}
  </span>

  <!-- Thumbnail Gradient -->
  <span class="hidden h-[42px] w-[60px] shrink-0 rounded-md sm:block" style="background: {gradient}" aria-hidden="true"
  ></span>

  <!-- Course Info -->
  <div class="min-w-0 flex-1">
    <h3 class="text-foreground truncate text-sm font-semibold tracking-tight">
      {course.title}
    </h3>
    <div class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-3 text-xs">
      <span class="flex items-center gap-1">
        <FileTextIcon class="size-3.5" />
        {course.lessonsCount}
        {course.lessonsCount === 1 ? 'lesson' : 'lessons'}
      </span>
      <span class="flex items-center gap-1">
        <CheckSquareIcon class="size-3.5" />
        {course.exercisesCount}
        {course.exercisesCount === 1 ? 'exercise' : 'exercises'}
      </span>
      <span class="font-medium">
        {course.cost > 0 ? `$${course.cost}` : 'Free'}
      </span>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex shrink-0 items-center gap-1.5">
    <Button
      href={`/courses/${course.courseId}`}
      target="_blank"
      rel="noopener noreferrer"
      variant="secondary"
      size="icon"
      class="text-muted-foreground hover:text-foreground size-8"
      title={$t('learningPath.builder.open_course')}
      aria-label={$t('learningPath.builder.open_course')}
    >
      <ExternalLinkIcon class="size-3.5" />
    </Button>

    <Button
      type="button"
      variant="secondary"
      size="icon"
      class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8"
      title={$t('learningPath.builder.remove_course')}
      aria-label={$t('learningPath.builder.remove_course')}
      onclick={() => onRemove(course)}
    >
      <Trash2Icon class="size-3.5" />
    </Button>
  </div>
</div>
