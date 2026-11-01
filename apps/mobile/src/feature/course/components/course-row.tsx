import { StyleSheet, View, type PressableProps } from 'react-native';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { ProgressRing } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { courseTypeKey } from '@/feature/course/constants/course-type';
import { progressPercentOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useCourseAvailableOffline } from '@/feature/downloads/helpers/download-store';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { CourseThumbnail } from './course-thumbnail';

type CourseRowProps = Pick<PressableProps, 'onPress' | 'onLongPress'> & { course: EnrolledCourse };

/** A course in a list; press handlers come from the wrapping `Link`. */
export function CourseRow({ course, onPress, onLongPress }: CourseRowProps) {
  const t = useTranslations(courseCatalog);
  const format = useFormatters();
  const progress = progressPercentOf(course);
  const percent = format.percent(progress);
  const lessons = t('lessonCount', { count: course.lessonCount ?? 0 });
  const typeKey = courseTypeKey(course.type);
  const type = typeKey ? t(typeKey) : null;
  const downloaded = useCourseAvailableOffline(course.id);

  return (
    <Item
      onPress={onPress ?? undefined}
      onLongPress={onLongPress ?? undefined}
      accessibilityLabel={[course.title, t('percentComplete', { percent }), downloaded ? t('downloaded') : null]
        .filter(Boolean)
        .join(', ')}
    >
      <ItemMedia>
        <CourseThumbnail uri={course.bannerImage || course.logo} recyclingKey={course.id} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{course.title}</ItemTitle>
        <ItemDescription numberOfLines={1}>
          {[type, lessons, downloaded ? t('downloaded') : null].filter(Boolean).join(' · ')}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <View style={styles.progress}>
          <ProgressRing value={progress} size={34} />
          <Text variant="micro" tone="muted" style={styles.percent}>
            {percent}
          </Text>
        </View>
      </ItemActions>
    </Item>
  );
}

const styles = StyleSheet.create({
  progress: { alignItems: 'center', justifyContent: 'center' },
  percent: { position: 'absolute', fontSize: 10, letterSpacing: -0.2 }
});
