import { Avatar } from '@/feature/common/components/avatar';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { TeachingActivity } from '@/feature/staff/types/staff';

/** One learner event in a taught course: an enrollment, a completed lesson or course, or a submitted exercise. */
export function ActivityRow({ item }: { item: TeachingActivity }) {
  const t = useTranslations(staffCatalog);
  const locale = useLocale();
  const learner = item.learner.fullname || item.learner.username || t('learnerFallback');
  const subject = item.subjectTitle || item.courseTitle;
  const title = {
    enrolled: t('activityEnrolled', { learner, course: item.courseTitle }),
    lesson_completed: t('activityLessonCompleted', { learner, lesson: subject }),
    exercise_submitted: t('activityExerciseSubmitted', { learner, exercise: subject }),
    course_completed: t('activityCourseCompleted', { learner, course: item.courseTitle })
  }[item.kind];
  const ago = timeAgo(item.occurredAt, Date.now(), locale);
  const showCourse = item.kind === 'lesson_completed' || item.kind === 'exercise_submitted';
  const detail = [showCourse ? item.courseTitle : null, ago].filter(Boolean).join(' · ');

  return (
    <Item>
      <ItemMedia>
        <Avatar name={learner} uri={item.learner.avatarUrl} size={36} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={2} variant="body">
          {title}
        </ItemTitle>
        <ItemDescription numberOfLines={1}>{detail}</ItemDescription>
      </ItemContent>
    </Item>
  );
}
