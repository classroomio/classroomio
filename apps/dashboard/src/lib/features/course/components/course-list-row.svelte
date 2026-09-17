<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { resolve } from '$app/paths';
  import { CourseListRow, DEFAULT_COURSE_BANNER_IMAGE, type CourseCardLabels } from '@cio/ui';
  import UserIcon from '@lucide/svelte/icons/user';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import GlobeIcon from '@lucide/svelte/icons/globe';

  import { t } from '$lib/utils/functions/translations';
  import CardDropdown from './card-dropdown.svelte';
  import CourseTagsOverflow from './course-tags-overflow.svelte';

  interface Tag {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  }

  interface Props {
    id: string;
    slug?: string;
    title: string;
    logo?: string | null;
    type?: string | null;
    description?: string;
    isPublished?: boolean;
    lessonCount?: number;
    exerciseCount?: number;
    totalStudents?: number;
    updatedAt?: string | null;
    tags?: Tag[];
    isExplore?: boolean;
    isLMS?: boolean;
    isAdmin?: boolean;
    isOnLandingPage?: boolean;
    isCertificateView?: boolean;
    href?: string;
    actions?: Snippet;
    onExploreClick?: () => void;
  }

  let {
    id,
    slug = '',
    title,
    logo = null,
    type,
    description = '',
    isPublished = false,
    lessonCount = 0,
    exerciseCount = 0,
    totalStudents = 0,
    tags = [],
    isExplore = false,
    isLMS = false,
    isAdmin = false,
    isOnLandingPage = false,
    isCertificateView = false,
    href,
    actions,
    onExploreClick
  }: Props = $props();

  const bannerImage = $derived(logo?.trim() ? logo : DEFAULT_COURSE_BANNER_IMAGE);

  const COURSE_TAG: Record<
    string,
    {
      label: string;
      icon: Component;
      iconStyle?: string;
    }
  > = {
    LIVE_CLASS: {
      label: $t('course.navItem.settings.live_class'),
      icon: CircleDotIcon,
      iconStyle: 'ui:size-3 ui:shrink-0 ui:text-red-600'
    },
    SELF_PACED: {
      label: $t('course.navItem.settings.self_paced'),
      icon: UserIcon,
      iconStyle: 'ui:size-3 ui:shrink-0 ui:text-primary'
    },
    COMPLIANCE: {
      label: $t('course.navItem.settings.compliance'),
      icon: ShieldCheckIcon,
      iconStyle: 'ui:size-3 ui:shrink-0 ui:text-emerald-600'
    },
    SPECIALIZATION: {
      label: $t('specialization.course_tag'),
      icon: TrendingUpIcon,
      iconStyle: 'ui:size-3 ui:shrink-0 ui:text-amber-600'
    }
  };

  const isExploreClickable = $derived(!!(isLMS && isExplore && onExploreClick));

  const courseUrl = $derived.by(() => {
    if (isExploreClickable) {
      return undefined;
    }

    if (href) {
      return href;
    }

    if (isCertificateView) {
      return `/courses/${id}/certificates`;
    }

    if (isOnLandingPage || isExplore) {
      if (!slug) {
        return undefined;
      }

      return `/course/${slug}`;
    }

    return `/courses/${id}${isLMS ? '/lessons?next=true' : ''}`;
  });

  const typeBadge = $derived(
    type && COURSE_TAG[type]
      ? {
          label: COURSE_TAG[type].label,
          icon: COURSE_TAG[type].icon,
          iconClass: COURSE_TAG[type].iconStyle
        }
      : undefined
  );

  const visibilityBadge = $derived(
    type === 'PUBLIC'
      ? {
          label: $t('courses.course_card.public_badge'),
          icon: GlobeIcon,
          iconClass: 'ui:size-3 ui:shrink-0 ui:text-primary'
        }
      : undefined
  );

  const showLmsPublicCourseMenu = $derived(isLMS && type === 'PUBLIC' && !!slug?.trim() && isPublished);

  const effectiveIsAdmin = $derived(!isLMS && !isExplore && !isOnLandingPage && !isCertificateView);

  const labels = $derived<CourseCardLabels>({
    courseBadge: $t('learningPath.badge.course'),
    lesson: $t('learningPath.card.lesson'),
    lessons: $t('learningPath.card.lessons'),
    exercise: $t('learningPath.card.exercise'),
    exercises: $t('learningPath.card.exercises'),
    completedLabel: $t('learningPath.course.completed_label'),
    progressLabel: $t('learningPath.progress.label'),
    earnedOn: $t('certificates.earned_on'),
    partOf: $t('learningPath.course.part_of'),
    learnMore: $t('courses.course_card.learn_more'),
    continueCourse: $t('courses.course_card.continue_course'),
    reviewCourse: $t('learningPath.course.review_course'),
    viewCertificate: $t('certificates.view_certificate'),
    manage: $t('learningPath.admin.manage'),
    published: $t('courses.course_card.published'),
    unpublished: $t('courses.course_card.unpublished'),
    students: $t('courses.course_card.students')
  });
</script>

<CourseListRow
  href={courseUrl ? resolve(courseUrl, {}) : undefined}
  {title}
  {description}
  coverImage={bannerImage}
  {typeBadge}
  {visibilityBadge}
  {lessonCount}
  {exerciseCount}
  {totalStudents}
  {isPublished}
  isLMS={!!isLMS}
  isExplore={!!isExplore}
  isAdmin={effectiveIsAdmin || !!isAdmin}
  isOnLandingPage={!!isOnLandingPage}
  isCertificateView={!!isCertificateView}
  {labels}
  onExploreClick={isExploreClickable ? onExploreClick : undefined}
>
  {#snippet overlay()}
    {#if actions}
      {@render actions()}
    {:else if !isOnLandingPage}
      {#if !isLMS}
        <CardDropdown {id} {title} {description} {isPublished} courseType={type} {slug} />
      {:else if showLmsPublicCourseMenu}
        <CardDropdown {id} {title} {description} {isPublished} courseType={type} {slug} lmsPublicQuickOnly={true} />
      {/if}
    {/if}
  {/snippet}

  {#if !isLMS && tags.length > 0}
    {#snippet tags()}
      <CourseTagsOverflow {tags} variant="card" />
    {/snippet}
  {/if}
</CourseListRow>
