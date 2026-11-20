<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { Progress } from '@cio/ui/base/progress';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { LearningPathBadge, DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseStatus } from './types';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle-2';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';

  interface Props {
    href: string;
    title: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    status: CourseStatus;
    progressPercent: number;
    partOfPath?: { name: string; href: string } | null;
    lessonCount?: number;
    exerciseCount?: number;
    courseType?: string;
  }

  let {
    href,
    title,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48))',
    coverImage,
    status,
    progressPercent,
    partOfPath = null,
    lessonCount,
    exerciseCount,
    courseType
  }: Props = $props();

  const done = $derived(status === 'COMPLETED');

  const courseTypeLabel = $derived(
    courseType === 'LIVE_CLASS'
      ? $t('learningPath.course.type_live_class')
      : courseType === 'COMPLIANCE'
        ? $t('learningPath.course.type_compliance')
        : courseType === 'SPECIALIZATION'
          ? $t('specialization.course_tag')
          : courseType === 'PUBLIC'
            ? $t('learningPath.course.type_public')
            : courseType === 'SELF_PACED'
              ? $t('learningPath.course.type_self_paced')
              : null
  );
</script>

<div class="group ui:hover:bg-muted/50 relative flex items-center gap-4 px-4 py-5 transition-colors">
  <a {href} aria-hidden="true" tabindex="-1" class="absolute inset-0 z-[1]"></a>

  <a
    {href}
    class="relative z-10 flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-sm"
    style="background: {coverGradient}"
    aria-label={title}
  >
    {#if coverImage}
      <img src={coverImage} alt={title} loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
    {:else}
      <img
        src={DEFAULT_COURSE_BANNER_IMAGE}
        alt={title}
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover"
      />
    {/if}
  </a>

  <div class="min-w-0 flex-1">
    <div class="mb-1 flex items-center gap-2">
      <LearningPathBadge label={$t('learningPath.badge.course')} />
      {#if courseTypeLabel}
        <Badge
          variant="outline"
          class="dark:border-border border-zinc-200/80 bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-900 uppercase dark:bg-white dark:text-zinc-900"
        >
          {courseTypeLabel}
        </Badge>
      {/if}
      {#if done}
        <Badge
          variant="outline"
          class="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircleIcon class="size-3" />
          {$t('learningPath.enrollment.completed')}
        </Badge>
      {:else if status === 'IN_PROGRESS'}
        <Badge variant="outline" class="ui:border-primary/30 ui:bg-primary/10 ui:text-primary">
          {$t('learningPath.enrollment.in_progress')}
        </Badge>
      {:else}
        <Badge variant="outline" class="ui:text-muted-foreground">
          {$t('learningPath.enrollment.not_started')}
        </Badge>
      {/if}
    </div>
    <a {href} class="relative z-10 w-fit">
      <h3 class="ui:hover:text-primary truncate text-sm font-semibold">{title}</h3>
    </a>
    <p class="ui:text-muted-foreground mt-0.5 truncate text-xs">{description}</p>

    <div class="ui:text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {#if typeof lessonCount === 'number'}
        <span class="inline-flex items-center gap-1">
          <BookOpenIcon class="size-3.5" />
          {lessonCount}
          {lessonCount === 1 ? $t('learningPath.card.lesson') : $t('learningPath.card.lessons')}
        </span>
      {/if}
      {#if typeof exerciseCount === 'number'}
        <span class="inline-flex items-center gap-1">
          <ClipboardCheckIcon class="size-3.5" />
          {exerciseCount}
          {exerciseCount === 1 ? $t('learningPath.card.exercise') : $t('learningPath.card.exercises')}
        </span>
      {/if}
      {#if partOfPath}
        <span class="inline-flex items-center gap-1.5">
          <PathIcon class="size-3.5 shrink-0" />
          {$t('learningPath.course.part_of')}:
          <a href={partOfPath.href} class="ui:text-foreground ui:hover:text-primary relative z-10 font-medium">
            <strong>{partOfPath.name}</strong>
          </a>
        </span>
      {/if}
    </div>
  </div>

  <div class="flex w-40 shrink-0 flex-col items-end gap-2">
    <div class="flex w-full items-center gap-2">
      <Progress value={progressPercent} class="h-1.5 flex-1 rounded-full" />
      <span class="tnum w-9 shrink-0 text-right text-xs font-semibold {done ? 'text-emerald-600' : ''}"
        >{progressPercent}%</span
      >
    </div>
    <Button {href} variant={done ? 'outline' : 'default'} size="sm" class="relative z-10 shrink-0">
      {done ? $t('learningPath.course.review_course') : $t('learningPath.course.continue_course')}
      {#if !done}<ArrowRightIcon class="size-4" />{/if}
    </Button>
  </div>
</div>
