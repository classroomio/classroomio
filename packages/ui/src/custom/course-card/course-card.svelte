<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { cn } from '../../tools';
  import { Badge, type BadgeVariant } from '../../base/badge';
  import { Button } from '../../base/button';
  import { Progress } from '../../base/progress';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle-2';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import GitBranchIcon from '@lucide/svelte/icons/git-branch';
  import { DEFAULT_COURSE_BANNER_IMAGE } from './constants';

  export interface CourseCardLabels {
    /** "Course" cover badge */
    courseBadge: string;
    lesson: string;
    lessons: string;
    exercise: string;
    exercises: string;
    /** e.g. "Completed" */
    completedLabel: string;
    /** e.g. "progress" */
    progressLabel: string;
    /** e.g. "Earned on" */
    earnedOn: string;
    /** e.g. "Part of" */
    partOf: string;
    learnMore: string;
    continueCourse: string;
    reviewCourse: string;
    viewCertificate: string;
    manage: string;
    published: string;
    unpublished: string;
    /** e.g. "students" */
    students: string;
  }

  export interface CourseCardCompliance {
    statusLabel?: string;
    statusVariant: BadgeVariant;
    dateLabel?: string;
    dateValue?: string;
  }

  type CourseSurface = 'certificate' | 'admin' | 'explore' | 'landing' | 'lms';

  interface Props {
    href?: string;
    title: string;
    description?: string;
    coverImage?: string;
    coverGradient?: string;
    typeBadge?: {
      label: string;
      icon: Component;
      iconClass?: string;
    } | null;
    /** e.g. public-course indicator on the banner */
    visibilityBadge?: {
      label: string;
      icon: Component;
      iconClass?: string;
    } | null;
    lessonCount?: number;
    exerciseCount?: number;
    progressPercent?: number;
    /** Enrollment state, meaningful on LMS/certificate surfaces */
    status?: string;
    totalStudents?: number;
    isPublished?: boolean;
    certificateEarnedAt?: string | null;
    partOfPath?: { name: string; href: string } | null;
    compliance?: CourseCardCompliance | null;
    isLMS?: boolean;
    isExplore?: boolean;
    isCertificateView?: boolean;
    isAdmin?: boolean;
    isOnLandingPage?: boolean;
    /** Overrides the surface-derived CTA label */
    ctaLabel?: string;
    onExploreClick?: () => void;
    labels: CourseCardLabels;
    class?: string;
    /** Optional overlay inside the cover (e.g. admin dropdown), typically absolutely positioned */
    overlay?: Snippet;
    /** Optional tags row (e.g. CourseTagsOverflow) */
    tags?: Snippet;
  }

  let {
    href,
    title,
    description,
    coverImage,
    coverGradient = 'linear-gradient(135deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48))',
    typeBadge,
    visibilityBadge,
    lessonCount,
    exerciseCount,
    progressPercent,
    status,
    totalStudents,
    isPublished = false,
    certificateEarnedAt,
    partOfPath = null,
    compliance = null,
    isLMS = false,
    isExplore = false,
    isCertificateView = false,
    isAdmin = false,
    isOnLandingPage = false,
    ctaLabel,
    onExploreClick,
    labels,
    class: className = '',
    overlay,
    tags
  }: Props = $props();

  const done = $derived(status === 'COMPLETED');

  const surface = $derived<CourseSurface>(
    isCertificateView
      ? 'certificate'
      : isAdmin
        ? 'admin'
        : isExplore
          ? 'explore'
          : isOnLandingPage
            ? 'landing'
            : isLMS
              ? 'lms'
              : 'admin'
  );

  const showProgress = $derived(surface === 'lms');
  const showCompletedBadge = $derived(surface === 'lms' && done);
  const showEarnedAt = $derived(surface === 'certificate' && !!certificateEarnedAt);
  const showPublishAndStudents = $derived(surface === 'admin');
  const showCompliance = $derived(surface === 'lms' && !!compliance);

  const isExploreClickable = $derived(surface === 'explore' && !!onExploreClick);

  /** Suppresses inner navigation so the whole card opens the explore modal */
  const innerHref = $derived(isExploreClickable ? undefined : href);

  const ctaVariant = $derived(surface === 'lms' && !done ? 'default' : 'outline');

  const showCtaArrow = $derived(surface !== 'lms');

  const ctaLabelText = $derived(
    ctaLabel ??
      (surface === 'admin'
        ? labels.manage
        : surface === 'certificate'
          ? labels.viewCertificate
          : surface === 'explore'
            ? labels.learnMore
            : surface === 'landing'
              ? labels.learnMore
              : done
                ? labels.reviewCourse
                : labels.continueCourse)
  );

  const showLessonExerciseCount = $derived(typeof lessonCount === 'number' || typeof exerciseCount === 'number');

  function handleCardClick(event: MouseEvent) {
    if (!isExploreClickable) return;
    event.preventDefault();
    onExploreClick?.();
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (!isExploreClickable) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onExploreClick?.();
  }

  function handleCtaClick(event: MouseEvent) {
    if (!isExploreClickable) return;
    event.preventDefault();
    event.stopPropagation();
    onExploreClick?.();
  }

  function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class={cn(
    'group ui:relative ui:flex ui:flex-col ui:overflow-hidden ui:rounded-sm ui:border ui:hover:border-primary/40 ui:w-full',
    className
  )}
  onclick={isExploreClickable ? handleCardClick : undefined}
  onkeydown={isExploreClickable ? handleCardKeydown : undefined}
  role={isExploreClickable ? 'button' : undefined}
  tabindex={isExploreClickable ? 0 : -1}
>
  {#if innerHref}
    <a href={innerHref} aria-label={title} class="ui:absolute ui:inset-0 ui:z-[1]"></a>
  {/if}

  <div class="ui:relative ui:flex ui:h-50 ui:items-center ui:justify-center ui:overflow-hidden ui:bg-card">
    {#if coverImage}
      <img
        src={coverImage}
        alt={title}
        loading="lazy"
        class="ui:absolute ui:inset-0 ui:h-full ui:w-full ui:object-cover"
      />
    {:else}
      <img
        src={DEFAULT_COURSE_BANNER_IMAGE}
        alt={title}
        loading="lazy"
        class="ui:absolute ui:inset-0 ui:h-full ui:w-full ui:object-cover"
      />
    {/if}

    <div class="ui:absolute ui:inset-x-0 ui:top-0 ui:flex ui:items-center ui:gap-2 ui:px-[13px] ui:py-[11px]">
      <Badge
        variant="outline"
        class="ui:border-white/30 ui:bg-white/15 ui:text-white ui:text-[10px] ui:font-semibold ui:tracking-[0.08em] ui:uppercase ui:backdrop-blur ui:rounded-md"
      >
        {labels.courseBadge}
      </Badge>

      {#if typeBadge}
        {@const Icon = typeBadge.icon}
        <Badge
          variant="outline"
          class="ui:bg-white ui:text-zinc-900 ui:border-zinc-200/80 ui:shadow-sm ui:text-[10px] ui:font-semibold ui:tracking-wide ui:uppercase ui:dark:bg-white ui:dark:border-border ui:rounded-md"
        >
          <Icon class={typeBadge.iconClass} />
          {typeBadge.label}
        </Badge>
      {/if}

      {#if visibilityBadge}
        {@const VIcon = visibilityBadge.icon}
        <Badge
          variant="outline"
          class="ui:bg-white ui:text-zinc-900 ui:border-zinc-200/80 ui:shadow-sm ui:text-[10px] ui:font-semibold ui:tracking-wide ui:uppercase ui:dark:bg-white ui:dark:border-border"
        >
          <VIcon class={VIcon.iconClass} />
          {visibilityBadge.label}
        </Badge>
      {/if}
    </div>

    {#if overlay}
      <div class="ui:absolute ui:top-0 ui:right-0 ui:z-40" onclick={(event) => event.stopPropagation()}>
        {@render overlay()}
      </div>
    {/if}
  </div>

  <div class="ui:flex ui:flex-1 ui:flex-col ui:gap-[9px] ui:p-4">
    {#if innerHref}
      <a href={innerHref} class="ui:relative ui:z-10 ui:w-fit">
        <h3 class="ui:line-clamp-2 ui:text-sm ui:font-semibold ui:tracking-tight ui:hover:text-primary">{title}</h3>
      </a>
    {:else}
      <h3 class="ui:line-clamp-2 ui:text-sm ui:font-semibold ui:tracking-tight ui:hover:text-primary">{title}</h3>
    {/if}

    {#if description}
      <p class="ui:line-clamp-2 ui:min-h-[33px] ui:text-xs ui:leading-snug ui:text-muted-foreground">{description}</p>
    {/if}

    {#if tags}
      <div class="ui:mt-1 {surface === 'admin' ? 'ui:min-h-5' : ''}">{@render tags()}</div>
    {/if}

    {#if showLessonExerciseCount}
      <div class="ui:flex ui:items-center ui:gap-3 ui:text-xs ui:text-muted-foreground">
        {#if typeof lessonCount === 'number'}
          <span class="ui:inline-flex ui:items-center ui:gap-1">
            <BookOpenIcon class="ui:size-3.5" />
            {lessonCount}
            {lessonCount === 1 ? labels.lesson : labels.lessons}
          </span>
        {/if}
        {#if typeof exerciseCount === 'number'}
          <span class="ui:inline-flex ui:items-center ui:gap-1">
            <ClipboardCheckIcon class="ui:size-3.5" />
            {exerciseCount}
            {exerciseCount === 1 ? labels.exercise : labels.exercises}
          </span>
        {/if}
      </div>
    {/if}

    {#if showCompletedBadge}
      <span
        class="ui:inline-flex ui:items-center ui:gap-1.5 ui:text-xs ui:font-medium ui:text-emerald-600 ui:dark:text-emerald-400"
      >
        <CheckCircleIcon class="ui:size-3.5" strokeWidth={2.4} />
        {labels.completedLabel}
      </span>
    {:else if showEarnedAt}
      <p class="ui:text-xs ui:text-muted-foreground">
        {labels.earnedOn}: {formatDate(certificateEarnedAt as string)}
      </p>
    {:else if showProgress}
      <div class="ui:flex ui:items-baseline ui:justify-between ui:text-xs">
        <span class="ui:text-muted-foreground">{labels.progressLabel}</span>
        <span class="ui:tabular-nums ui:font-semibold">{progressPercent}%</span>
      </div>
      <Progress value={progressPercent} class="ui:h-1.5 ui:rounded-full" />
    {/if}

    {#if showCompliance}
      <div class="ui:mt-1 ui:flex ui:flex-wrap ui:items-center ui:gap-2">
        {#if compliance.statusLabel}
          <Badge variant={compliance.statusVariant}>{compliance.statusLabel}</Badge>
        {/if}
        {#if compliance.dateLabel && compliance.dateValue}
          <p class="ui:text-xs ui:text-muted-foreground">
            {compliance.dateLabel}: {compliance.dateValue}
          </p>
        {/if}
      </div>
    {/if}

    {#if showPublishAndStudents}
      <div class="ui:flex ui:items-center ui:gap-2 ui:text-xs">
        <Badge variant={isPublished ? 'default' : 'outline'}>
          {isPublished ? labels.published : labels.unpublished}
        </Badge>
        {#if (totalStudents ?? 0) > 0}
          <span class="ui:text-muted-foreground">
            {totalStudents}
            {labels.students}
          </span>
        {/if}
      </div>
    {/if}

    {#if partOfPath}
      <span class="ui:inline-flex ui:items-center ui:gap-1.5 ui:text-xs ui:text-muted-foreground">
        <GitBranchIcon class="ui:size-3.5 ui:shrink-0" />
        {labels.partOf}:
        <a
          href={innerHref ? partOfPath.href : undefined}
          class="ui:relative ui:z-10 ui:font-medium ui:text-foreground ui:hover:text-primary"
        >
          <strong>{partOfPath.name}</strong>
        </a>
      </span>
    {/if}

    <div class="ui:mt-1 ui:flex ui:flex-1 ui:items-end">
      <Button
        href={innerHref}
        variant={ctaVariant}
        size="sm"
        class="ui:relative ui:z-10 ui:w-full"
        onclick={isExploreClickable ? handleCtaClick : undefined}
      >
        {ctaLabelText}
        {#if showCtaArrow}<ArrowRightIcon class="ui:size-4" />{/if}
      </Button>
    </div>
  </div>
</div>
