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
  import type { CourseCardCompliance, CourseCardLabels } from './course-card.svelte';

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
    visibilityBadge?: {
      label: string;
      icon: Component;
      iconClass?: string;
    } | null;
    lessonCount?: number;
    exerciseCount?: number;
    progressPercent?: number;
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
    ctaLabel?: string;
    onExploreClick?: () => void;
    labels: CourseCardLabels;
    class?: string;
    overlay?: Snippet;
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
    'ui:group ui:flex ui:items-center ui:gap-4 ui:rounded-xl ui:border ui:p-4 ui:shadow-xs ui:transition-colors ui:hover:border-primary/40 ui:w-full',
    className
  )}
  onclick={isExploreClickable ? handleCardClick : undefined}
  onkeydown={isExploreClickable ? handleCardKeydown : undefined}
  role={isExploreClickable ? 'button' : undefined}
  tabindex={isExploreClickable ? 0 : -1}
>
  <a
    href={innerHref}
    class="ui:relative ui:flex ui:h-20 ui:w-28 ui:shrink-0 ui:items-center ui:justify-center ui:overflow-hidden ui:rounded-lg"
    style="background: {coverGradient}"
    aria-label={title}
  >
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
  </a>

  <div class="ui:min-w-0 ui:flex-1">
    <div class="ui:mb-1 ui:flex ui:flex-wrap ui:items-center ui:gap-2">
      <Badge
        variant="outline"
        class="ui:border-primary/30 ui:bg-primary/10 ui:text-primary ui:text-[10px] ui:font-semibold ui:tracking-[0.08em] ui:uppercase"
      >
        {labels.courseBadge}
      </Badge>

      {#if typeBadge}
        {@const Icon = typeBadge.icon}
        <Badge
          variant="outline"
          class="ui:border-zinc-200/80 ui:bg-white ui:text-zinc-900 ui:shadow-xs ui:text-[10px] ui:font-semibold ui:tracking-wide ui:uppercase ui:dark:bg-white ui:dark:border-border"
        >
          <Icon class={typeBadge.iconClass} />
          {typeBadge.label}
        </Badge>
      {/if}

      {#if visibilityBadge}
        {@const VIcon = visibilityBadge.icon}
        <Badge
          variant="outline"
          class="ui:border-zinc-200/80 ui:bg-white ui:text-zinc-900 ui:shadow-xs ui:text-[10px] ui:font-semibold ui:tracking-wide ui:uppercase ui:dark:bg-white ui:dark:border-border"
        >
          <VIcon class={visibilityBadge.iconClass} />
          {visibilityBadge.label}
        </Badge>
      {/if}

      {#if showPublishAndStudents}
        <Badge variant={isPublished ? 'default' : 'outline'}>
          {isPublished ? labels.published : labels.unpublished}
        </Badge>
      {/if}

      {#if showCompletedBadge}
        <Badge
          variant="outline"
          class="ui:gap-1 ui:border-emerald-500/30 ui:bg-emerald-500/10 ui:text-emerald-600 ui:dark:text-emerald-400"
        >
          <CheckCircleIcon class="ui:size-3" />
          {labels.completedLabel}
        </Badge>
      {/if}
    </div>

    <a href={innerHref} class="ui:w-fit">
      <h3 class="ui:truncate ui:text-sm ui:font-semibold ui:tracking-tight ui:hover:text-primary">{title}</h3>
    </a>

    {#if description}
      <p class="ui:mt-0.5 ui:truncate ui:text-xs ui:text-muted-foreground">{description}</p>
    {/if}

    {#if tags}
      <div class="ui:mt-1.5">
        {@render tags()}
      </div>
    {/if}

    <div class="ui:mt-2 ui:flex ui:flex-wrap ui:items-center ui:gap-x-4 ui:gap-y-1 ui:text-xs ui:text-muted-foreground">
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
      {#if showPublishAndStudents && (totalStudents ?? 0) > 0}
        <span class="ui:inline-flex ui:items-center ui:gap-1">
          {totalStudents}
          {labels.students}
        </span>
      {/if}
      {#if showEarnedAt}
        <span>{labels.earnedOn}: {formatDate(certificateEarnedAt as string)}</span>
      {/if}
      {#if partOfPath}
        <span class="ui:inline-flex ui:items-center ui:gap-1.5">
          <GitBranchIcon class="ui:size-3.5 ui:shrink-0" />
          {labels.partOf}:
          <a
            href={innerHref ? partOfPath.href : undefined}
            class="ui:font-medium ui:text-foreground ui:hover:text-primary"
          >
            <strong>{partOfPath.name}</strong>
          </a>
        </span>
      {/if}
      {#if showCompliance && compliance}
        {#if compliance.statusLabel}
          <Badge variant={compliance.statusVariant}>{compliance.statusLabel}</Badge>
        {/if}
        {#if compliance.dateLabel && compliance.dateValue}
          <span>{compliance.dateLabel}: {compliance.dateValue}</span>
        {/if}
      {/if}
    </div>
  </div>

  <div class="ui:flex ui:shrink-0 ui:flex-col ui:items-end ui:justify-between ui:gap-2">
    {#if overlay}
      <div class="ui:self-end" onclick={(event) => event.stopPropagation()}>
        {@render overlay()}
      </div>
    {/if}

    {#if showProgress && !done && typeof progressPercent === 'number'}
      <div class="ui:flex ui:w-36 ui:items-center ui:gap-2">
        <Progress value={progressPercent} class="ui:h-1.5 ui:flex-1 ui:rounded-full" />
        <span class="ui:text-xs ui:font-medium ui:tabular-nums">{progressPercent}%</span>
      </div>
    {/if}

    <Button
      href={innerHref}
      variant={ctaVariant}
      size="sm"
      class="ui:min-w-24"
      onclick={isExploreClickable ? handleCtaClick : undefined}
    >
      {ctaLabelText}
      {#if showCtaArrow}<ArrowRightIcon class="ui:size-4" />{/if}
    </Button>
  </div>
</div>
