import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { withAlpha } from '@/feature/common/helpers/color';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { progressPercentOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { CourseBanner } from './course-banner';
import { CourseZoomLink } from './course-zoom-link';

/** The course the learner is most likely to resume: its artwork full-bleed, with the title and progress set over it. */
export function ContinueLearningCard({ course }: { course: EnrolledCourse }) {
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const progress = progressPercentOf(course);
  const percent = t('percentComplete', { percent: format.percent(progress) });
  const lessons = t('lessonCount', { count: course.lessonCount ?? 0 });

  return (
    <CourseZoomLink courseId={course.id}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${common('continue')}, ${course.title}, ${percent}`}
        scaleTo={0.98}
      >
        <View style={[styles.card, { backgroundColor: colors.muted }]}>
          <CourseBanner
            uri={course.bannerImage || course.logo}
            recyclingKey={course.id}
            style={StyleSheet.absoluteFill}
          />
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0.25" stopColor={colors.artworkScrim} stopOpacity={0} />
                <Stop offset="1" stopColor={colors.artworkScrim} stopOpacity={0.82} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrim)" />
          </Svg>

          <View style={styles.overlay}>
            <Text variant="captionStrong" style={{ color: withAlpha(colors.onSolid, 0.8) }} numberOfLines={1}>
              {`${percent} · ${lessons}`}
            </Text>
            <Text variant="title" style={{ color: colors.onSolid }} numberOfLines={2}>
              {course.title}
            </Text>
            <View style={styles.footer}>
              <View style={[styles.track, { backgroundColor: withAlpha(colors.onSolid, 0.3) }]}>
                <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.onSolid }]} />
              </View>
              <View style={[styles.play, { backgroundColor: colors.onSolid }]}>
                <Icon icon={PlayIcon} size={20} color={colors.primary} weight="fill" />
              </View>
            </View>
          </View>
        </View>
      </PressableScale>
    </CourseZoomLink>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 4 / 3,
    justifyContent: 'flex-end',
    borderRadius: RADII.sheet,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  overlay: { padding: SPACING.lg, gap: SPACING.xxs },
  footer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  track: {
    flex: 1,
    height: 5,
    borderRadius: RADII.pill,
    overflow: 'hidden'
  },
  fill: { height: '100%', borderRadius: RADII.pill },
  play: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill
  }
});
