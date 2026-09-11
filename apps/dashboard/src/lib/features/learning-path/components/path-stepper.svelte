<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathCourseProgress } from '../utils/types';
  import BookIcon from '@lucide/svelte/icons/book-open';
  import CheckIcon from '@lucide/svelte/icons/check';
  import LockIcon from '@lucide/svelte/icons/lock';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import CertificateIcon from '@lucide/svelte/icons/badge-check';
  import PlayIcon from '@lucide/svelte/icons/play';

  interface Props {
    courses: LearningPathCourseProgress[];
    courseHref: (order: number) => string;
    certificateEnabled: boolean;
    certificateTitle: string;
    certificateEarned: boolean;
  }

  let { courses, courseHref, certificateEnabled, certificateTitle, certificateEarned }: Props = $props();

  const isCompleted = (course: LearningPathCourseProgress) => course.state === 'COMPLETED';
  const isLocked = (course: LearningPathCourseProgress) => course.state === 'LOCKED';
  const isCurrent = (course: LearningPathCourseProgress) =>
    course.state === 'IN_PROGRESS' || course.state === 'NOT_STARTED';
  const lessonsLabel = (course: LearningPathCourseProgress) =>
    `${course.lessonsCompleted} / ${course.lessonCount} ${$t('learningPath.detail.lessons')}`;
  const exercisesLabel = (course: LearningPathCourseProgress) =>
    `${course.exercisesCompleted} / ${course.exerciseCount} ${$t('learningPath.detail.exercises')}`;
</script>

<ol class="relative space-y-3">
  {#each courses as course, index}
    <li class="relative flex gap-5">
      <!-- rail + node -->
      <div class="relative flex flex-col items-center">
        <div
          class={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full border',
            isCompleted(course)
              ? 'ui:border-emerald-500/30 ui:bg-emerald-500/10 ui:text-emerald-600 ui:dark:text-emerald-400'
              : isLocked(course)
                ? 'ui:border-border ui:bg-muted ui:text-muted-foreground'
                : 'ui:border-primary/40 ui:bg-primary/10 ui:text-primary'
          )}
        >
          {#if isCompleted(course)}
            <CheckIcon class="size-4" />
          {:else if isLocked(course)}
            <LockIcon class="size-4" />
          {:else}
            <PlayIcon class="size-4" />
          {/if}
        </div>
        {#if index < courses.length - 1 || certificateEnabled}
          <div
            class={cn('ui:bg-border h-full w-px', isCompleted(course) ? 'ui:bg-emerald-500/40' : 'ui:bg-border')}
          ></div>
        {/if}
      </div>

      <!-- course card -->
      <article
        class={cn(
          'mb-1 flex flex-1 gap-4 rounded-xl border p-4 transition-colors',
          isLocked(course) ? 'opacity-75' : 'hover:ui:border-ring',
          isCurrent(course) ? 'ui:border-primary/30' : ''
        )}
      >
        <a
          href={isLocked(course) ? undefined : courseHref(course.order)}
          class={cn(
            'relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg',
            isLocked(course) && 'pointer-events-none'
          )}
          style="background: {course.coverGradient ??
            'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))'}"
          aria-label={course.title}
        >
          <BookIcon class="ui:text-white/40 size-7" />
          {#if isLocked(course)}
            <div class="ui:bg-black/30 absolute inset-0 flex items-center justify-center">
              <LockIcon class="ui:text-white size-5" />
            </div>
          {/if}
        </a>

        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="tnum text-muted-foreground text-xs font-medium">
              {String(index + 1).padStart(2, '0')}
            </span>
            {#if isCompleted(course)}
              <Badge
                variant="outline"
                class="ui:border-emerald-500/30 ui:bg-emerald-500/10 ui:text-emerald-600 ui:dark:text-emerald-400 gap-1"
              >
                <CheckIcon class="size-3" />
                {$t('learningPath.enrollment.completed')}
              </Badge>
            {:else if isLocked(course)}
              <Badge variant="outline" class="ui:border-border ui:bg-muted ui:text-muted-foreground gap-1">
                <LockIcon class="size-3" />
                {$t('learningPath.enrollment.locked')}
              </Badge>
            {:else}
              <Badge variant="outline" class="ui:border-primary/25 ui:bg-primary/10 ui:text-primary gap-1">
                <PlayIcon class="size-3" />
                {$t('learningPath.enrollment.in_progress')}
              </Badge>
            {/if}
          </div>

          <a href={isLocked(course) ? undefined : courseHref(course.order)} class="mt-1 w-fit">
            <h3 class="text-sm leading-snug font-semibold {isLocked(course) ? '' : 'hover:ui:text-primary'}">
              {course.title}
            </h3>
          </a>

          <div class="ui:text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {#if isLocked(course)}
              <span class="inline-flex items-center gap-1">
                <BookIcon class="size-3.5" />
                {course.lessonCount}
                {$t('learningPath.enrollment.lessons_label')}
              </span>
              <span class="inline-flex items-center gap-1">
                <LockIcon class="size-3.5" />
                {$t('learningPath.detail.unlocks_after')}
                {String(course.order - 1)}
                {course.order - 1 === 1 ? $t('learningPath.card.course') : $t('learningPath.card.courses')}
              </span>
            {:else}
              {#if course.lessonCount > 0}
                <span class="inline-flex items-center gap-1">
                  <BookIcon class="size-3.5" />
                  {lessonsLabel(course)}
                </span>
              {/if}
              {#if course.exerciseCount > 0}
                <span class="inline-flex items-center gap-1">
                  <CheckIcon class="size-3.5" />
                  {exercisesLabel(course)}
                </span>
              {/if}
              {#if course.durationHours > 0}
                <span class="inline-flex items-center gap-1">
                  <ClockIcon class="size-3.5" />
                  ~{course.durationHours}h
                </span>
              {/if}
            {/if}
          </div>

          {#if !isLocked(course)}
            <div class="mt-3 flex items-center gap-2">
              <Progress value={course.progressPercent} class="h-1.5 flex-1 rounded-full" />
              <span class="tnum w-8 shrink-0 text-right text-xs font-semibold">{course.progressPercent}%</span>
            </div>
          {/if}
        </div>

        <div class="flex shrink-0 flex-col items-end justify-between py-0.5">
          {#if isCurrent(course)}
            <Button href={courseHref(course.order)} variant="default" size="sm">
              {course.progressPercent > 0
                ? $t('learningPath.hero.continue_learning')
                : $t('learningPath.hero.start_learning')}
            </Button>
          {:else if isCompleted(course)}
            <Button href={courseHref(course.order)} variant="outline" size="sm">
              {$t('learningPath.detail.review')}
            </Button>
          {:else}
            <Button variant="secondary" size="sm" disabled>
              <LockIcon class="size-3.5" />
              {$t('learningPath.enrollment.locked')}
            </Button>
          {/if}
        </div>
      </article>
    </li>
  {/each}

  {#if certificateEnabled}
    <li class="relative flex gap-5">
      <div class="flex flex-col items-center">
        <div
          class={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full border',
            certificateEarned
              ? 'ui:border-emerald-500/30 ui:bg-emerald-500/10 ui:text-emerald-600 ui:dark:text-emerald-400'
              : 'ui:border-border ui:bg-muted ui:text-muted-foreground'
          )}
        >
          <CertificateIcon class="size-4" />
        </div>
      </div>

      <div
        class={cn(
          'mb-1 flex flex-1 items-center gap-4 rounded-xl border border-dashed p-4',
          certificateEarned ? 'ui:border-emerald-500/30 ui:bg-emerald-500/5' : 'ui:border-muted'
        )}
      >
        <div class="ui:bg-muted ui:text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-lg">
          <CertificateIcon class="size-5" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold">{certificateTitle}</p>
          <p class="ui:text-muted-foreground text-xs">
            {certificateEarned
              ? $t('learningPath.detail.certificate_earned')
              : $t('learningPath.detail.certificate_hint')}
          </p>
        </div>
        {#if certificateEarned}
          <Button href="/lms/certificates" variant="outline" size="sm" class="shrink-0">
            {$t('learningPath.card.view_certificate')}
          </Button>
        {/if}
      </div>
    </li>
  {/if}
</ol>
