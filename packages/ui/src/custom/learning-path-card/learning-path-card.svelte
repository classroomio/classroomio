<script lang="ts">
  import { Badge, type BadgeVariant } from '../../base/badge';
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
    progressPercent: number;
    coursesCompleted: number;
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
    progressPercent,
    coursesCompleted,
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

  const showCertificateBadge = $derived((surface === 'lms' || surface === 'certificate') && done);
  const showProgress = $derived(surface === 'lms');
  const showStatusBadge = $derived(surface === 'admin');
  const showEarnedAt = $derived(surface === 'certificate' && !!certificateEarnedAt);

  const isExploreClickable = $derived(surface === 'explore' && !!onExploreClick);

  const ctaVariant = 'outline';

  const ctaHref = $derived(surface === 'certificate' || (surface === 'lms' && done) ? '/lms/certificates' : href);

  const ctaLabelText = $derived(
    ctaLabel ??
      (surface === 'admin'
        ? status === 'DRAFT'
          ? labels.adminContinueSetup
          : labels.adminManage
        : surface === 'certificate' || (surface === 'lms' && done)
          ? labels.viewCertificate
          : surface === 'explore' || surface === 'landing'
            ? labels.viewPath
            : coursesCompleted === 0
              ? labels.startLearning
              : labels.continueLearning)
  );

  const showCtaArrow = $derived(surface !== 'lms');

  const statusBadgeLabel = $derived(
    status === 'DRAFT' ? labels.statusDraft : status === 'ACTIVE' ? labels.statusActive : labels.statusArchived
  );

  const statusBadgeVariant = $derived<BadgeVariant>(
    status === 'ACTIVE' ? 'success' : status === 'DRAFT' ? 'warning' : 'secondary'
  );

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
  <!-- Stacked card underlay — signals "multiple courses inside" at a glance -->
  <div
    class="ui:pointer-events-none ui:absolute ui:inset-0 ui:-translate-x-1.5 ui:translate-y-1.5 ui:rounded-sm ui:border ui:border-border ui:group-hover/stack:bg-primary ui:transition-transform ui:duration-300 ui:group-hover/stack:-translate-x-2 ui:group-hover/stack:translate-y-2"
    aria-hidden="true"
  ></div>

  <div
    class="ui:relative ui:flex ui:flex-col ui:overflow-hidden ui:rounded-sm ui:border ui:bg-card ui:group-hover/stack:translate-x-0.5 ui:group-hover/stack:-translate-y-0.5"
    onclick={isExploreClickable ? handleCardClick : undefined}
    role={isExploreClickable ? 'button' : undefined}
  >
    <a
      {href}
      class="ui:group ui:relative ui:flex ui:h-50 ui:items-center ui:justify-center ui:overflow-hidden ui:bg-card"
      aria-label={name}
    >
      {#if coverImage}
        <img
          src={coverImage}
          alt={name}
          loading="lazy"
          class="ui:absolute ui:inset-0 ui:h-full ui:w-full ui:object-cover ui:transition-transform ui:duration-300 ui:group-hover:scale-105"
        />
      {:else}
        <img
          src={DEFAULT_COURSE_BANNER_IMAGE}
          alt={name}
          loading="lazy"
          class="ui:absolute ui:inset-0 ui:h-full ui:w-full ui:object-cover"
        />
      {/if}
      <LearningPathBadge label={labels.badge} onCover class="ui:absolute ui:top-3 ui:left-3" />
    </a>

    <div class="ui:flex ui:flex-1 ui:flex-col ui:gap-2 ui:p-4 ui:pt-3">
      <a {href} class="ui:w-fit">
        <h3 class="ui:line-clamp-2 ui:text-sm ui:leading-snug ui:font-semibold ui:hover:text-primary">{name}</h3>
      </a>

      <p class="ui:line-clamp-2 ui:h-10 ui:text-xs ui:leading-relaxed ui:text-muted-foreground">{description}</p>

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

      {#if showStatusBadge}
        <!-- status badge is rendered inline with the button below -->
      {:else if showEarnedAt}
        <p class="ui:text-xs ui:text-muted-foreground">
          {labels.earnedOn}: {formatDate(certificateEarnedAt as string)}
        </p>
      {/if}

      {#if showProgress}
        <div class="ui:mt-2">
          <div class="ui:mb-1.5 ui:flex ui:items-center ui:justify-between">
            <span class="ui:text-xs ui:text-muted-foreground">{labels.progressLabel}</span>
            <span class="ui:text-xs ui:font-semibold ui:tabular-nums {done ? 'ui:text-emerald-600' : ''}"
              >{progressPercent}%</span
            >
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

      <div class="ui:mt-1 ui:flex ui:flex-1 ui:items-end">
        {#if showStatusBadge}
          <div class="ui:flex ui:w-full ui:items-center ui:justify-between ui:gap-2">
            <Badge variant={statusBadgeVariant} class="ui:shrink-0">{statusBadgeLabel}</Badge>
            <Button href={isExploreClickable ? undefined : ctaHref} variant={ctaVariant} size="sm">
              {ctaLabelText}
              {#if showCtaArrow}<ArrowRightIcon class="ui:size-4" />{/if}
            </Button>
          </div>
        {:else}
          <Button href={isExploreClickable ? undefined : ctaHref} variant={ctaVariant} size="sm" class="ui:w-full">
            {ctaLabelText}
            {#if showCtaArrow}<ArrowRightIcon class="ui:size-4" />{/if}
          </Button>
        {/if}
      </div>
    </div>
  </div>
</div>
