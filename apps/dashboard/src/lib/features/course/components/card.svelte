<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { resolve } from '$app/paths';
  import { CourseCard, DEFAULT_COURSE_BANNER_IMAGE, type CourseCardLabels } from '@cio/ui';
  import UserIcon from '@lucide/svelte/icons/user';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import GlobeIcon from '@lucide/svelte/icons/globe';

  import { t } from '$lib/utils/functions/translations';
  import { calcCourseProgress, calcProgressRate } from '$features/course/utils/functions';
  import {
    getStudentCourseComplianceDate,
    getStudentCourseComplianceStatusKey,
    getStudentCourseComplianceStatusVariant,
    shouldShowStudentCourseComplianceStatusBadge
  } from '$features/course/utils/compliance-utils';
  import CardDropdown from './card-dropdown.svelte';
  import CourseTagsOverflow from './course-tags-overflow.svelte';
  import type { OrgCourses, UserEnrolledCourses } from '$features/course/types';
  import type { OrgPublicCourses } from '$features/org/utils/types';

  export interface Props {
    course: OrgCourses[number] | UserEnrolledCourses[number] | OrgPublicCourses[number];
    isOnLandingPage?: boolean;
    isLMS?: boolean;
    isExplore?: boolean;
    isCertificateView?: boolean;
    href?: string;
    actions?: Snippet;
    onExploreClick?: () => void;
  }

  let { course, isOnLandingPage, isLMS, isExplore, isCertificateView, href, actions, onExploreClick }: Props = $props();

  let {
    bannerImage,
    id = '',
    slug = '',
    title = '',
    description = '',
    isPublished = false,
    totalLessons = 0,
    totalExercises = 0,
    totalStudents = 0,
    progressRate = 45,
    type
  } = $derived({
    id: course.id,
    slug: course.slug,
    bannerImage: course.logo || DEFAULT_COURSE_BANNER_IMAGE,
    title: course.title,
    type: course.type,
    description: course.description,
    isPublished: !!course.isPublished,
    totalLessons: course.lessonCount,
    totalExercises: (() => {
      const c = course as { exerciseCount?: number };
      return typeof c.exerciseCount === 'number' ? c.exerciseCount : 0;
    })(),
    progressRate: (() => {
      const c = course as { exerciseCount?: number; exercisesCompleted?: number };
      if (typeof c.exerciseCount === 'number' && typeof c.exercisesCompleted === 'number') {
        return calcCourseProgress({
          lessonsCompleted: 'progressRate' in course ? (course.progressRate ?? 0) : 0,
          totalLessons: course.lessonCount ?? 0,
          exercisesCompleted: c.exercisesCompleted,
          totalExercises: c.exerciseCount
        });
      }
      return calcProgressRate('progressRate' in course ? course.progressRate : 0, course.lessonCount);
    })(),
    totalStudents: 'totalStudents' in course ? course.totalStudents : 0
  });

  const courseTags = $derived(
    ('tags' in course && Array.isArray(course.tags) ? course.tags : []) as Array<{
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    }>
  );

  const COURSE_TAG: Record<
    string,
    {
      style: string;
      label: string;
      icon: Component;
      iconStyle?: string;
    }
  > = {
    ['LIVE_CLASS']: {
      style: '',
      label: $t('course.navItem.settings.live_class'),
      icon: CircleDotIcon,
      iconStyle: 'ui:size-3 ui:shrink-0 ui:text-red-600'
    },
    ['SELF_PACED']: {
      style: '',
      label: $t('course.navItem.settings.self_paced'),
      icon: UserIcon,
      iconStyle: 'ui:size-3 ui:shrink-0 ui:text-primary'
    },
    ['COMPLIANCE']: {
      style: '',
      label: $t('course.navItem.settings.compliance'),
      icon: ShieldCheckIcon,
      iconStyle: 'ui:size-3 ui:shrink-0 ui:text-emerald-600'
    },
    SPECIALIZATION: {
      style: '',
      label: $t('specialization.course_tag'),
      icon: TrendingUpIcon,
      iconStyle: 'ui:size-3 ui:shrink-0 ui:text-amber-600'
    }
  };

  const isExploreClickable = $derived(!!(isLMS && isExplore && onExploreClick));

  let courseUrl = $derived.by(() => {
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

  const complianceStatusKey = $derived(
    isLMS && type === 'COMPLIANCE' && !isExplore
      ? getStudentCourseComplianceStatusKey(course as UserEnrolledCourses[number])
      : null
  );
  const showComplianceStatusBadge = $derived(
    isLMS && type === 'COMPLIANCE' && !isExplore
      ? shouldShowStudentCourseComplianceStatusBadge(course as UserEnrolledCourses[number])
      : false
  );
  const complianceStatusVariant = $derived(
    isLMS && type === 'COMPLIANCE' && !isExplore
      ? getStudentCourseComplianceStatusVariant(course as UserEnrolledCourses[number])
      : 'outline'
  );
  const complianceDate = $derived(
    isLMS && type === 'COMPLIANCE' && !isExplore
      ? getStudentCourseComplianceDate(course as UserEnrolledCourses[number])
      : null
  );

  const certificateEarnedAt = $derived(
    isCertificateView && 'certificateEarnedAt' in course ? course.certificateEarnedAt : null
  );

  const status = $derived(
    certificateEarnedAt
      ? 'COMPLETED'
      : progressRate >= 100 && isLMS
        ? 'COMPLETED'
        : progressRate > 0 && isLMS
          ? 'IN_PROGRESS'
          : 'NOT_STARTED'
  );

  const compliance = $derived.by(() => {
    if (isLMS && type === 'COMPLIANCE' && !isExplore) {
      return {
        statusLabel: showComplianceStatusBadge && complianceStatusKey ? $t(complianceStatusKey) : undefined,
        statusVariant: complianceStatusVariant,
        dateLabel: complianceDate?.labelKey ? $t(complianceDate.labelKey) : undefined,
        dateValue: complianceDate?.value ? formatDate(complianceDate.value) : undefined
      };
    }

    return null;
  });

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

  function formatDate(value: string | null | undefined) {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium'
    }).format(date);
  }
</script>

<CourseCard
  href={courseUrl ? resolve(courseUrl, {}) : undefined}
  {title}
  {description}
  coverImage={bannerImage}
  {typeBadge}
  {visibilityBadge}
  lessonCount={totalLessons}
  exerciseCount={totalExercises}
  progressPercent={progressRate}
  {status}
  totalStudents={'totalStudents' in course ? course.totalStudents : undefined}
  {isPublished}
  {certificateEarnedAt}
  {compliance}
  isLMS={!!isLMS}
  isExplore={!!isExplore}
  isCertificateView={!!isCertificateView}
  isOnLandingPage={!!isOnLandingPage}
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

  {#if !isLMS}
    {#snippet tags()}
      <CourseTagsOverflow tags={courseTags} variant="card" />
    {/snippet}
  {/if}
</CourseCard>
