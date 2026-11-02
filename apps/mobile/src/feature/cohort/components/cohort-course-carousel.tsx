import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { CohortCourseInfo } from '@/feature/cohort/types/cohort';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { CourseBanner } from '@/feature/course/components/course-banner';
import { COURSE_CARD_WIDTH, CourseCard } from '@/feature/course/components/course-card';
import type { EnrolledCourse } from '@/feature/course/types/course';

const GAP = SPACING.sm;

export type CohortCourseEntry =
  | { kind: 'enrolled'; course: EnrolledCourse }
  | { kind: 'catalog'; course: CohortCourseInfo };

function renderEntry({ item }: { item: CohortCourseEntry }) {
  return item.kind === 'enrolled' ? <CourseCard course={item.course} /> : <CohortCatalogCard course={item.course} />;
}

function keyOf(entry: CohortCourseEntry) {
  return entry.course.id;
}

function Gap() {
  return <View style={styles.gap} />;
}

/** The cohort's courses as a snapping row of artwork cards; enrolled courses show the learner's progress. */
export function CohortCourseCarousel({ entries }: { entries: CohortCourseEntry[] }) {
  return (
    <View style={styles.bleed}>
      <FlashList
        horizontal
        data={entries}
        renderItem={renderEntry}
        keyExtractor={keyOf}
        getItemType={(entry) => entry.kind}
        ItemSeparatorComponent={Gap}
        showsHorizontalScrollIndicator={false}
        snapToInterval={COURSE_CARD_WIDTH + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

/** A cohort course the learner is not enrolled in; opens its catalogue landing. */
function CohortCatalogCard({ course }: { course: CohortCourseInfo }) {
  const { colors } = useTheme();

  return (
    <Link
      href={{ pathname: '/learn/explore/[courseId]', params: { courseId: course.id } }}
      push
      asChild
      onPress={tapHaptic}
    >
      <PressableScale accessibilityRole="button" accessibilityLabel={course.title ?? undefined} scaleTo={0.96}>
        <View style={styles.card}>
          <View style={[styles.artwork, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <CourseBanner uri={course.coverImage} recyclingKey={course.id} style={StyleSheet.absoluteFill} />
          </View>
          <Text variant="subheading" numberOfLines={2}>
            {course.title}
          </Text>
        </View>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -GUTTER },
  content: { paddingHorizontal: GUTTER, paddingVertical: SPACING.xxs },
  gap: { width: GAP },
  card: { width: COURSE_CARD_WIDTH, gap: SPACING.sm },
  artwork: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden'
  }
});
