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
import { courseSnapshotLine } from '@/feature/teach/helpers/course-snapshot';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { TeachingCourse } from '@/feature/teach/types/teach';

type TeachCourseRowProps = { course: TeachingCourse; onPress: (course: TeachingCourse) => void };

export function TeachCourseRow({ course, onPress }: TeachCourseRowProps) {
  const t = useTranslations(teachCatalog);
  const format = useFormatters();
  const snapshot = courseSnapshotLine(course, t, format);
  const toGrade = course.toGrade > 0 ? t('toGradeCount', { count: course.toGrade }) : null;

  return (
    <Item
      onPress={() => onPress(course)}
      accessibilityLabel={[course.title, snapshot, toGrade].filter(Boolean).join(', ')}
    >
      <ItemMedia>
        <CourseThumbnail uri={course.bannerImage || course.logo} size={44} recyclingKey={course.id} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{course.title}</ItemTitle>
        <ItemDescription numberOfLines={1}>{snapshot}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {toGrade && (
          <Text variant="captionStrong" tone="primary">
            {toGrade}
          </Text>
        )}
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
