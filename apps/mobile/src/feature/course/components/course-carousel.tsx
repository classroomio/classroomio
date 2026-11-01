import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';

import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import type { EnrolledCourse } from '@/feature/course/types/course';

import { COURSE_CARD_WIDTH, CourseCard } from './course-card';

const GAP = SPACING.sm;

function renderCourse({ item }: { item: EnrolledCourse }) {
  return <CourseCard course={item} />;
}

function keyOf(course: EnrolledCourse) {
  return course.id;
}

function Gap() {
  return <View style={styles.gap} />;
}

/** A horizontally scrolling row of course cards that snaps card by card, bleeding to the screen edges. */
export function CourseCarousel({ courses }: { courses: EnrolledCourse[] }) {
  return (
    <View style={styles.bleed}>
      <FlashList
        horizontal
        data={courses}
        renderItem={renderCourse}
        keyExtractor={keyOf}
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

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -GUTTER },
  content: { paddingHorizontal: GUTTER, paddingVertical: SPACING.xxs },
  gap: { width: GAP }
});
