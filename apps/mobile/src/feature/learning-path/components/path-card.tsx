import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { withAlpha } from '@/feature/common/helpers/color';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { CourseBanner } from '@/feature/course/components/course-banner';
import { COURSE_CARD_WIDTH } from '@/feature/course/components/course-card';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { pathProgressLabel } from '@/feature/learning-path/helpers/path-copy';
import { learningPathCatalog } from '@/feature/learning-path/translations/catalog';
import type { EnrolledPath } from '@/feature/learning-path/types/learning-path';

export function openPath(pathId: string, from: 'learning' | 'explore' = 'learning') {
  tapHaptic();
  router.push({
    pathname: from === 'explore' ? '/explore/path/[pathId]' : '/learning/path/[pathId]',
    params: { pathId }
  });
}

/** A learning path on a shelf: its cover with progress along the bottom, then name and course progress. */
export function PathCard({ path, width = COURSE_CARD_WIDTH }: { path: EnrolledPath; width?: number }) {
  const t = useTranslations(learningPathCatalog);
  const { colors } = useTheme();
  const meta = `${t('pathLabel')} · ${pathProgressLabel(path, t)}`;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${path.name}, ${meta}`}
      scaleTo={0.96}
      onPress={() => openPath(path.id)}
    >
      <View style={[styles.card, { width }]}>
        <View style={[styles.artwork, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <CourseBanner uri={path.coverImage} recyclingKey={path.id} style={StyleSheet.absoluteFill} />
          {path.progressPercent > 0 ? (
            <View style={[styles.track, { backgroundColor: withAlpha(colors.artworkScrim, 0.35) }]}>
              <View style={[styles.fill, { width: `${path.progressPercent}%`, backgroundColor: colors.onSolid }]} />
            </View>
          ) : null}
        </View>
        <View style={styles.copy}>
          <Text variant="subheading" numberOfLines={2}>
            {path.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.sm },
  artwork: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden'
  },
  track: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: SPACING.sm,
    height: 4,
    borderRadius: RADII.pill,
    overflow: 'hidden'
  },
  fill: { height: '100%', borderRadius: RADII.pill },
  copy: { gap: SPACING.xxs / 2 }
});
