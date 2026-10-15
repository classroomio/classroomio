<script lang="ts">
  import { CourseCard, LearningPathCard, type CourseCardLabels, type LearningPathCardLabels } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import {
    getCourseTypeBadgeMeta,
    getCourseVisibilityBadgeMeta,
    toCourseCardBadge
  } from '$features/course/utils/course-card-badges';
  import type { EarnedCertificate } from '../utils/types';

  interface Props {
    certificate: EarnedCertificate;
  }

  let { certificate }: Props = $props();

  const courseType = $derived(certificate.kind === 'course' ? certificate.data.type : undefined);
  const typeBadge = $derived(toCourseCardBadge(getCourseTypeBadgeMeta(courseType), $t));
  const visibilityBadge = $derived(toCourseCardBadge(getCourseVisibilityBadgeMeta(courseType), $t));

  const courseCardLabels = $derived<CourseCardLabels>({
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

  const learningPathCardLabels = $derived<LearningPathCardLabels>({
    badge: $t('learningPath.badge.learning_path'),
    course: $t('learningPath.card.course'),
    courses: $t('learningPath.card.courses'),
    certificateEarned: $t('learningPath.card.certificate_earned'),
    adminContinueSetup: $t('learningPath.admin.continue_setup'),
    adminManage: $t('learningPath.admin.manage'),
    viewCertificate: $t('learningPath.card.view_certificate'),
    viewPath: $t('learningPath.hero.view_path'),
    startLearning: $t('learningPath.hero.start_learning'),
    continueLearning: $t('learningPath.hero.continue_learning'),
    statusDraft: $t('learningPath.status.draft'),
    statusActive: $t('learningPath.status.active'),
    statusArchived: $t('learningPath.status.archived'),
    progressLabel: $t('learningPath.progress.label'),
    of: $t('learningPath.card.of'),
    coursesCompleted: $t('learningPath.hero.courses_completed'),
    earnedOn: $t('certificates.earned_on')
  });
</script>

{#if certificate.kind === 'course'}
  <CourseCard
    isCertificateView
    href={`/courses/${certificate.data.id}/certificates`}
    title={certificate.data.title}
    description={certificate.data.description}
    coverImage={certificate.data.logo || undefined}
    {typeBadge}
    {visibilityBadge}
    status="COMPLETED"
    certificateEarnedAt={certificate.data.earnedAt}
    labels={courseCardLabels}
  />
{:else}
  <LearningPathCard
    isCertificateView
    href={`/paths/${certificate.data.publicId}`}
    name={certificate.data.name}
    description={certificate.data.description}
    coverImage={certificate.data.coverImage ?? undefined}
    courseCount={certificate.data.courseCount}
    progressPercent={100}
    coursesCompleted={certificate.data.courseCount}
    certificateEarned={certificate.data.certificateAvailable}
    certificateEarnedAt={certificate.data.earnedAt}
    labels={learningPathCardLabels}
  />
{/if}
