import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { Text } from '@/feature/common/components/text';
import { CourseThumbnail } from '@/feature/course/components/course-thumbnail';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { TeachingCourse } from '@/feature/teach/types/teach';

type StaffCourseRowProps = { course: TeachingCourse; onPress: (course: TeachingCourse) => void };

/** A course the viewer teaches or manages: published state, learners, average completion and grading waiting. */
export function StaffCourseRow({ course, onPress }: StaffCourseRowProps) {
  const t = useTranslations(staffCatalog);
  const teach = useTranslations(teachCatalog);
  const format = useFormatters();
  const status = course.isPublished ? t('published') : t('draft');
  const learners = t('learnerCount', { count: course.enrolled });
  const completion =
    course.enrolled > 0 ? t('averageCompletionShort', { percent: format.percent(course.averageProgress) }) : null;
  const toGrade = course.toGrade > 0 ? teach('toGradeCount', { count: course.toGrade }) : null;

  return (
    <Item
      onPress={() => onPress(course)}
      accessibilityLabel={[course.title, status, learners, completion, toGrade].filter(Boolean).join(', ')}
    >
      <ItemMedia>
        <CourseThumbnail uri={course.bannerImage || course.logo} size={44} recyclingKey={course.id} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={2}>{course.title}</ItemTitle>
        <ItemDescription numberOfLines={1}>
          <Text variant="captionStrong" tone={course.isPublished ? 'success' : 'muted'}>
            {status}
          </Text>
          {` · ${learners}`}
        </ItemDescription>
        {completion || toGrade ? (
          <Text variant="caption" tone="subtle" numberOfLines={1}>
            {[completion, toGrade].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </ItemContent>
      <ItemActions>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
