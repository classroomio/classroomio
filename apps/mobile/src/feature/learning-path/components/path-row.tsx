import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { COURSE_ROW_ARTWORK_RATIO, COURSE_ROW_ARTWORK_WIDTH } from '@/feature/course/components/course-row';
import { CourseThumbnail } from '@/feature/course/components/course-thumbnail';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { openPath } from '@/feature/learning-path/components/path-card';
import { learningPathCatalog } from '@/feature/learning-path/translations/catalog';

type PathRowProps = {
  id: string;
  name: string;
  coverImage: string | null;
  meta: string;
  /** 0–100; omitted for paths the learner has not joined. */
  progressPercent?: number;
  from: 'learning' | 'explore';
  /** Pads the row for use inside an `ItemGroup` card. */
  inset?: boolean;
};

/** A learning path in a list: its cover, name, course count and, once joined, progress. */
export function PathRow({ id, name, coverImage, meta, progressPercent, from, inset = false }: PathRowProps) {
  const t = useTranslations(learningPathCatalog);
  const { colors } = useTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={[name, t('pathLabel'), meta].join(', ')}
      scaleTo={0.985}
      onPress={() => openPath(id, from)}
      style={[styles.row, inset && styles.inset]}
    >
      <CourseThumbnail
        uri={coverImage}
        size={COURSE_ROW_ARTWORK_WIDTH}
        aspectRatio={COURSE_ROW_ARTWORK_RATIO}
        recyclingKey={id}
      />
      <View style={styles.copy}>
        <Text variant="subheading" numberOfLines={2}>
          {name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {`${t('pathLabel')} · ${meta}`}
        </Text>
        {progressPercent !== undefined && progressPercent > 0 && progressPercent < 100 ? (
          <View style={[styles.track, { backgroundColor: colors.mutedStrong }]}>
            <View style={[styles.fill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  inset: { paddingHorizontal: SPACING.sm },
  copy: { flex: 1, gap: 2 },
  track: { height: 4, borderRadius: RADII.pill, overflow: 'hidden', marginTop: SPACING.xs },
  fill: { height: '100%', borderRadius: RADII.pill }
});
