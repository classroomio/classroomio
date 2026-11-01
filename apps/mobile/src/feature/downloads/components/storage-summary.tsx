import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/feature/common/components/card';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export type StorageSegment = { id: string; label: string; bytes: number };

const SEGMENT_OPACITY = [1, 0.62, 0.4, 0.24];
const MAX_SEGMENTS = SEGMENT_OPACITY.length;

type StorageSummaryValue = { segments: StorageSegment[]; usedBytes: number };

const StorageSummaryContext = createContext<StorageSummaryValue>({ segments: [], usedBytes: 0 });

/** Folds the smallest entries into one "Other" segment so the bar and legend stay readable. */
function segmentsOf(items: StorageSegment[], otherLabel: string): StorageSegment[] {
  const sorted = [...items].filter((item) => item.bytes > 0).sort((a, b) => b.bytes - a.bytes);
  if (sorted.length <= MAX_SEGMENTS) return sorted;

  const kept = sorted.slice(0, MAX_SEGMENTS - 1);
  const rest = sorted.slice(MAX_SEGMENTS - 1).reduce((total, item) => total + item.bytes, 0);

  return [...kept, { id: 'other', label: otherLabel, bytes: rest }];
}

export function StorageSummary({ items, children }: { items: StorageSegment[]; children: ReactNode }) {
  const t = useTranslations(downloadsCatalog);
  const segments = segmentsOf(items, t('otherCourses'));
  const usedBytes = items.reduce((total, item) => total + item.bytes, 0);

  return (
    <StorageSummaryContext value={{ segments, usedBytes }}>
      <Card style={styles.card}>{children}</Card>
    </StorageSummaryContext>
  );
}

export function StorageSummaryHeader({ freeBytes }: { freeBytes: number | null }) {
  const { usedBytes } = use(StorageSummaryContext);
  const t = useTranslations(downloadsCatalog);
  const locale = useLocale();
  const used = t('usedSize', { size: formatBytes(usedBytes, locale) });

  return (
    <View style={styles.header}>
      <Text variant="captionStrong">{t('storageOnDevice')}</Text>
      <Text variant="caption" tone="muted" style={styles.numbers}>
        {freeBytes === null ? used : `${used} · ${t('freeSize', { size: formatBytes(freeBytes, locale) })}`}
      </Text>
    </View>
  );
}

export function StorageBar() {
  const { colors } = useTheme();
  const { segments, usedBytes } = use(StorageSummaryContext);

  return (
    <View
      style={[styles.bar, { backgroundColor: colors.mutedStrong }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {segments.map((segment, index) => (
        <View
          key={segment.id}
          style={{
            flex: usedBytes > 0 ? segment.bytes / usedBytes : 0,
            backgroundColor: colors.primary,
            opacity: SEGMENT_OPACITY[index]
          }}
        />
      ))}
    </View>
  );
}

export function StorageLegend() {
  const { colors } = useTheme();
  const { segments } = use(StorageSummaryContext);
  const locale = useLocale();
  if (segments.length === 0) return null;

  return (
    <View style={styles.legend}>
      {segments.map((segment, index) => (
        <View
          key={segment.id}
          style={styles.legendItem}
          accessible
          accessibilityLabel={`${segment.label}, ${formatBytes(segment.bytes, locale)}`}
        >
          <View style={[styles.swatch, { backgroundColor: colors.primary, opacity: SEGMENT_OPACITY[index] }]} />
          <Text variant="caption" tone="muted" numberOfLines={1} style={styles.legendLabel}>
            {segment.label}
          </Text>
          <Text variant="caption" style={styles.numbers}>
            {formatBytes(segment.bytes, locale)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: SPACING.md, gap: SPACING.sm },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACING.sm },
  numbers: { fontVariant: ['tabular-nums'] },
  bar: { flexDirection: 'row', height: 8, borderRadius: RADII.pill, overflow: 'hidden', gap: 2 },
  legend: { gap: SPACING.xxs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { flex: 1 }
});
