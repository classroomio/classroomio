<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button } from '../../base/button';
  import LearningPathBadge from './learning-path-badge.svelte';
  import LearningPathProgress from './learning-path-progress.svelte';
  import BookIcon from '@lucide/svelte/icons/book-open';
  import CertificateIcon from '@lucide/svelte/icons/badge-check';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { DEFAULT_COURSE_BANNER_IMAGE } from '../course-card/constants';

  export type LearningPathCardStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  export interface LearningPathCardLabels {
    badge: string;
    course: string;
    courses: string;
    certificateEarned: string;
    adminContinueSetup: string;
    adminManage: string;
    viewCertificate: string;
    viewPath: string;
    startLearning: string;
    continueLearning: string;
    statusDraft: string;
    statusActive: string;
    statusArchived: string;
    progressLabel: string;
    of: string;
    coursesCompleted: string;
    earnedOn: string;
  }

  interface Props {
    href: string;
    name: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    courseCount: number;
    totalHours?: number;
    progressPercent?: number;
    coursesCompleted?: number;
    certificateEarned?: boolean;
    certificateEarnedAt?: string | null;
    status?: LearningPathCardStatus;
    ctaLabel?: string;
    isLMS?: boolean;
    isExplore?: boolean;
    isOnLandingPage?: boolean;
    isAdmin?: boolean;
    isCertificateView?: boolean;
    onExploreClick?: () => void;
    /** Admin action menu (e.g. edit/delete dropdown), rendered over the cover */
    overlay?: Snippet;
    /** Extra row below the action row (e.g. publish badge + learner counts) */
    footer?: Snippet;
    labels: LearningPathCardLabels;
  }

  let {
    href,
    name,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    coverImage,
    courseCount,
    totalHours,
    progressPercent = 0,
    coursesCompleted = 0,
    certificateEarned = false,
    certificateEarnedAt,
    status = 'ACTIVE',
    ctaLabel,
    isLMS = false,
    isExplore = false,
    isOnLandingPage = false,
    isAdmin = false,
    isCertificateView = false,
    onExploreClick,
    overlay,
    footer,
    labels
  }: Props = $props();

  const surface = $derived(
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

  const done = $derived(certificateEarned || (coursesCompleted === courseCount && courseCount > 0));

  const offersCertificate = $derived(surface === 'certificate' || (surface === 'lms' && done && certificateEarned));
  const showCertificateBadge = $derived(offersCertificate && certificateEarned);
  const showProgress = $derived(surface === 'lms');
  const showEarnedAt = $derived(surface === 'certificate' && !!certificateEarnedAt);

  const isExploreClickable = $derived(surface === 'explore' && !!onExploreClick);

  const ctaVariant = 'outline';

  const ctaHref = $derived(surface === 'lms' && certificateEarned ? '/lms/certificates' : href);

  const ctaLabelText = $derived(
    ctaLabel ??
      (surface === 'admin'
        ? status === 'DRAFT'
          ? labels.adminContinueSetup
          : labels.adminManage
        : offersCertificate
          ? labels.viewCertificate
          : surface === 'explore' || surface === 'landing'
            ? labels.viewPath
            : done
              ? labels.viewPath
              : coursesCompleted === 0
                ? labels.startLearning
                : labels.continueLearning)
  );

  const showCtaArrow = $derived(surface !== 'lms');
  const showCta = $derived(!offersCertificate || certificateEarned);

  function handleCardClick(event: MouseEvent) {
    if (!isExploreClickable) return;
    event.preventDefault();
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

<div class="ui:group/stack ui:relative ui:mx-auto ui:w-full">
  <!-- Stacked card underlay -->
  <div
    class="ui:pointer-events-none ui:absolute ui:inset-0 ui:-translate-x-1.5 ui:translate-y-1.5 ui:rounded-sm ui:border ui:border-border ui:transition-all ui:duration-300 ui:group-hover/stack:-translate-x-2 ui:group-hover/stack:translate-y-2 ui:group-hover/stack:border-primary/65"
    aria-hidden="true"
  ></div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="ui:relative ui:flex ui:flex-col ui:overflow-hidden ui:rounded-sm ui:border ui:bg-card ui:transition-colors ui:group-hover/stack:translate-x-0.5 ui:group-hover/stack:-translate-y-0.5 ui:group-hover/stack:border-primary/65"
    onclick={isExploreClickable ? handleCardClick : undefined}
    onkeydown={isExploreClickable
      ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExploreClick?.();
          }
        }
      : undefined}
    role={isExploreClickable ? 'button' : undefined}
    tabindex={isExploreClickable ? 0 : -1}
  >
    <!-- Full-card clickable overlay (same pattern as Course card) -->
    {#if !isExploreClickable}
      <a {href} aria-label={name} class="ui:absolute ui:inset-0 ui:z-[1]"></a>
    {/if}

    <!-- Cover -->
    <div class="ui:relative ui:flex ui:h-50 ui:items-center ui:justify-center ui:overflow-hidden ui:bg-card">
      {#if coverImage}
        <img
          src={coverImage}
          alt={name}
          loading="lazy"
          class="ui:absolute ui:inset-0 ui:h-full ui:w-full ui:object-cover ui:transition-transform ui:duration-300 ui:group-hover/stack:scale-105"
        />
      {:else}
        <img
          src={DEFAULT_COURSE_BANNER_IMAGE}
          alt={name}
          loading="lazy"
          class="ui:absolute ui:inset-0 ui:h-full ui:w-full ui:object-cover"
        />
      {/if}
      <LearningPathBadge
        label={labels.badge}
        onCover
        class="ui:rounded-sm ui:border-none ui:absolute ui:top-3 ui:left-3"
      />
      {#if overlay}
        <div class="ui:absolute ui:top-3 ui:right-3 ui:z-20" onclick={(event) => event.stopPropagation()}>
          {@render overlay()}
        </div>
      {/if}
    </div>

    <!-- Body -->
    <div class="ui:flex ui:flex-1 ui:flex-col ui:gap-2 ui:p-4 ui:pt-3">
      <a href={isExploreClickable ? undefined : href} class="ui:relative ui:z-10 ui:w-fit">
        <h3 class="ui:line-clamp-2 ui:text-sm ui:leading-snug ui:font-semibold ui:hover:text-primary">
          {name}
        </h3>
      </a>

      <p class="ui:line-clamp-2 ui:h-10 ui:text-xs ui:leading-relaxed ui:text-muted-foreground">
        {description}
      </p>

      {#if surface !== 'certificate'}
        <div class="ui:flex ui:items-center ui:gap-3 ui:text-xs ui:text-muted-foreground">
          <span class="ui:inline-flex ui:items-center ui:gap-1">
            <BookIcon class="ui:size-3.5" />
            {courseCount}
            {courseCount === 1 ? labels.course : labels.courses}
          </span>
          {#if showCertificateBadge}
            <span class="ui:inline-flex ui:items-center ui:gap-1">
              <CertificateIcon class="ui:size-3.5" />
              {labels.certificateEarned}
            </span>
          {/if}
        </div>
      {/if}

      {#if showEarnedAt}
        <p class="ui:text-xs ui:text-muted-foreground">
          {labels.earnedOn}: {formatDate(certificateEarnedAt as string)}
        </p>
      {/if}

      {#if showProgress}
        <div class="ui:mt-2">
          <div class="ui:mb-1.5 ui:flex ui:items-center ui:justify-between">
            <span class="ui:text-xs ui:text-muted-foreground">{labels.progressLabel}</span>
            <span class="ui:text-xs ui:font-semibold ui:tabular-nums {done ? 'ui:text-emerald-600' : ''}">
              {progressPercent}%
            </span>
          </div>
          <LearningPathProgress value={progressPercent} />
          <p class="ui:mt-1.5 ui:text-xs ui:tabular-nums ui:text-muted-foreground">
            {coursesCompleted}
            <span class="ui:normal-case">{labels.of}</span>
            {courseCount}
            {labels.coursesCompleted}
          </p>
        </div>
      {/if}

      {#if footer}
        <div class="ui:relative ui:z-10 ui:mt-2">{@render footer()}</div>
      {/if}

      <div class="ui:relative ui:z-10 ui:mt-1 ui:flex ui:flex-1 ui:items-end">
        {#if showCta}
          <Button
            href={isExploreClickable ? undefined : ctaHref}
            variant={ctaVariant}
            size="sm"
            class="ui:w-full"
            onclick={isExploreClickable
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onExploreClick?.();
                }
              : undefined}
          >
            {ctaLabelText}
            {#if showCtaArrow}<ArrowRightIcon class="ui:size-4" />{/if}
          </Button>
        {/if}
      </div>
    </div>
  </div>
</div>
