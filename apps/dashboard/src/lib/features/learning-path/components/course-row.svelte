<script lang="ts">
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathCourseItem } from '../utils/types';
  import CourseContentIcon from '$lib/features/course/components/course-content-icon.svelte';
  import { ContentType } from '@cio/utils';
  import { MoneyIcon } from '@cio/ui/custom/moving-icons';

  interface Props {
    course: LearningPathCourseItem;
    order?: number;
    reorder?: boolean;
    onRemove: (course: LearningPathCourseItem) => void;
  }

  let { course, order = course.order, reorder = false, onRemove }: Props = $props();

  const formattedPrice = $derived(
    course.cost > 0
      ? new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: course.currency
        }).format(course.cost)
      : $t('courses.pricing_free')
  );

  const metaChipClass =
    'ui:bg-muted ui:text-muted-foreground inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px]';
</script>

<div
  class="ui:bg-card ui:text-card-foreground flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg border p-3 transition {reorder
    ? 'cursor-grab active:cursor-grabbing'
    : 'ui:border-border hover:ui:border-ring/50'}"
  style={reorder ? 'border: 2px #1d4ed8 solid; border-style: dashed; cursor: grab;' : ''}
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
    {order}
  </span>

  <!-- Course Info -->
  <div class="min-w-0 flex-1 overflow-hidden">
    {#if reorder}
      <span class="ui:text-foreground block min-w-0 truncate text-sm font-medium" title={course.title}>
        {course.title}
      </span>
    {:else}
      <a
        href={`/courses/${course.courseId}`}
        target="_blank"
        rel="noopener noreferrer"
        class="ui:text-foreground block min-w-0 truncate text-sm font-medium hover:underline"
        title={course.title}
      >
        {course.title}
      </a>
    {/if}

    <div class="mt-1 flex flex-wrap items-center gap-2">
      <span class={metaChipClass}>
        <CourseContentIcon type={ContentType.Lesson} size={12} colored={false} />
        {$t('learningPath.builder.lessons_count', { count: course.lessonsCount })}
      </span>

      <span class={metaChipClass}>
        <CourseContentIcon type={ContentType.Exercise} size={12} colored={false} />
        {$t('learningPath.builder.exercises_count', { count: course.exercisesCount })}
      </span>

      <span class={metaChipClass}>
        <MoneyIcon class="size-3 [&_svg]:h-3 [&_svg]:w-3" />
        {formattedPrice}
      </span>
    </div>
  </div>

  <!-- Actions -->
  {#if reorder}
    <div class="pointer-events-none flex shrink-0 items-center gap-1 opacity-40" aria-hidden="true">
      <span class="ui:text-muted-foreground flex size-8 items-center justify-center">
        <ExternalLinkIcon class="size-4" />
      </span>
      <span class="ui:text-muted-foreground flex size-8 items-center justify-center">
        <Trash2Icon class="size-4" />
      </span>
    </div>
  {:else}
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
  {/if}
</div>
