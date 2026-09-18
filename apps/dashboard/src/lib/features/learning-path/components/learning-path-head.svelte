<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { LearningPathBadge, LearningPathProgress } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import BookIcon from '@lucide/svelte/icons/book-open';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import LockKeyholeIcon from '@lucide/svelte/icons/lock';
  import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-right';

  interface Props {
    name: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    courseCount: number;
    totalHours: number;
    sequentialUnlock: boolean;
    certificateEnabled: boolean;
    progressPercent: number;
    coursesCompleted: number;
    nextCourseTitle?: string | null;
    isPublic?: boolean;
    enrollHref?: string;
  }

  const hours = (totalHours: number) =>
    globalThis.Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(totalHours);
  const isComplete = (completed: number, count: number) => count > 0 && completed === count;

  let {
    name,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    coverImage,
    courseCount,
    totalHours,
    sequentialUnlock,
    certificateEnabled,
    progressPercent,
    coursesCompleted,
    nextCourseTitle = null,
    isPublic = false,
    enrollHref = '#'
  }: Props = $props();
</script>

<div class="grid gap-5 rounded-2xl border p-5 md:grid-cols-[12rem_1fr] md:p-6">
  <div
    class="relative flex aspect-[25/10] w-full items-center justify-center overflow-hidden rounded-xl md:aspect-auto md:h-auto"
    style="background: {coverGradient}"
  >
    {#if coverImage}
      <img src={coverImage} alt={name} loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
    {:else}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-20 text-white/30" aria-hidden="true">
        <path d="M6 3v12" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="6" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    {/if}
  </div>

  <div class="flex min-w-0 flex-col">
    <div class="mb-2">
      <LearningPathBadge label={$t('learningPath.badge.learning_path')} />
    </div>

    <h1 class="text-xl font-semibold tracking-tight">{name}</h1>
    <p class="ui:text-muted-foreground mt-1 text-sm leading-relaxed">
      {description}
    </p>

    <div class="ui:text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      <span class="inline-flex items-center gap-1">
        <BookIcon class="size-3.5" />
        {courseCount}
        {courseCount === 1 ? $t('learningPath.card.course') : $t('learningPath.card.courses')}
      </span>
      <span class="inline-flex items-center gap-1">
        <ClockIcon class="size-3.5" />
        ~{hours(totalHours)} hours
      </span>
      {#if sequentialUnlock}
        <span class="inline-flex items-center gap-1">
          <LockKeyholeIcon class="size-3.5" />
          {$t('learningPath.detail.sequential')}
        </span>
      {/if}
      {#if certificateEnabled}
        <span class="inline-flex items-center gap-1">
          <BadgeCheckIcon class="size-3.5" />
          {$t('learningPath.detail.certificate_on_completion')}
        </span>
      {/if}
    </div>

    {#if !isPublic}
      <div class="mt-5">
        <div class="mb-1.5 flex items-center justify-between gap-3">
          <div class="flex items-baseline gap-2 text-sm">
            <span class="ui:text-muted-foreground">{$t('learningPath.progress.label')}</span>
            <span class="tnum font-semibold">
              {coursesCompleted}
              {$t('learningPath.card.of')}
              {courseCount}
              {$t('learningPath.detail.courses_complete')}
            </span>
          </div>
          <span class="tnum text-sm font-bold">{progressPercent}%</span>
        </div>
        <LearningPathProgress value={progressPercent} />

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p class="ui:text-muted-foreground min-w-0 flex-1 truncate text-xs">
            {#if isComplete(coursesCompleted, courseCount)}
              <span class="font-medium text-emerald-600 dark:text-emerald-400"
                >{$t('learningPath.detail.all_courses_complete')}</span
              >
            {:else if nextCourseTitle}
              <span class="ui:text-foreground font-medium">{$t('learningPath.hero.up_next')}:</span>
              {nextCourseTitle}
            {/if}
          </p>
          <Button
            href={enrollHref}
            variant={isComplete(coursesCompleted, courseCount) ? 'outline' : 'default'}
            size="default"
            class="shrink-0"
          >
            {isComplete(coursesCompleted, courseCount)
              ? $t('learningPath.detail.view_certificate')
              : coursesCompleted === 0
                ? $t('learningPath.hero.start_learning')
                : $t('learningPath.hero.continue_learning')}
            <ArrowUpRightIcon class="size-4" />
          </Button>
        </div>
      </div>
    {:else}
      <div class="mt-5">
        <Button href={enrollHref} variant="default" size="default">
          {$t('learningPath.detail.enroll')}
          <ArrowUpRightIcon class="size-4" />
        </Button>
      </div>
    {/if}
  </div>
</div>
