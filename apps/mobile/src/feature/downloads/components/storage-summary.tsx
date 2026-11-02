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

const MIN_DOWNLOADS_SHARE = 0.015;

type StorageValue = { usedBytes: number; freeBytes: number | null; totalBytes: number | null };

const StorageSummaryContext = createContext<StorageValue>({ usedBytes: 0, freeBytes: null, totalBytes: null });

type StorageSummaryProps = StorageValue & { children: ReactNode };

/** Space used by downloads against the rest of the device, when the device reports its capacity. */
export function StorageSummary({ usedBytes, freeBytes, totalBytes, children }: StorageSummaryProps) {
  return (
    <StorageSummaryContext value={{ usedBytes, freeBytes, totalBytes }}>
      <Card style={styles.card}>{children}</Card>
    </StorageSummaryContext>
  );
}

export function StorageSummaryHeader() {
  const { usedBytes } = use(StorageSummaryContext);
  const t = useTranslations(downloadsCatalog);
  const locale = useLocale();

  return (
    <View style={styles.header}>
      <Text variant="captionStrong" tone="muted">
        {t('storageOnDevice')}
      </Text>
      <Text
        variant="display"
        style={styles.numbers}
        accessibilityLabel={t('usedSize', { size: formatBytes(usedBytes, locale) })}
      >
        {formatBytes(usedBytes, locale)}
      </Text>
      <Text variant="caption" tone="muted">
        {t('usedByDownloads')}
      </Text>
    </View>
  );
}

function useBreakdown() {
  const { usedBytes, freeBytes, totalBytes } = use(StorageSummaryContext);
  if (freeBytes === null || totalBytes === null || totalBytes <= 0) return null;

  const otherBytes = Math.max(0, totalBytes - freeBytes - usedBytes);
  const downloadsShare = usedBytes > 0 ? Math.max(MIN_DOWNLOADS_SHARE, usedBytes / totalBytes) : 0;

  return { usedBytes, otherBytes, freeBytes, downloadsShare, otherShare: otherBytes / totalBytes };
}

export function StorageMeter() {
  const { colors } = useTheme();
  const breakdown = useBreakdown();
  if (!breakdown) return null;

  return (
    <View
      style={[styles.meter, { backgroundColor: colors.mutedStrong }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ flex: breakdown.downloadsShare, backgroundColor: colors.primary }} />
      <View style={{ flex: breakdown.otherShare, backgroundColor: colors.inkSubtle }} />
      <View style={{ flex: Math.max(0, 1 - breakdown.downloadsShare - breakdown.otherShare) }} />
    </View>
  );
}

function LegendItem({ color, label, bytes }: { color: string; label: string; bytes: number }) {
  const locale = useLocale();
  const size = formatBytes(bytes, locale);

  return (
    <View style={styles.legendItem} accessible accessibilityLabel={`${label}, ${size}`}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text variant="caption" tone="muted" numberOfLines={1} style={styles.legendLabel}>
        {label}
      </Text>
      <Text variant="captionStrong" style={styles.numbers}>
        {size}
      </Text>
    </View>
  );
}

export function StorageLegend() {
  const { colors } = useTheme();
  const t = useTranslations(downloadsCatalog);
  const breakdown = useBreakdown();
  if (!breakdown) return null;

  return (
    <View style={styles.legend}>
      <LegendItem color={colors.primary} label={t('legendDownloads')} bytes={breakdown.usedBytes} />
      <LegendItem color={colors.inkSubtle} label={t('legendOther')} bytes={breakdown.otherBytes} />
      <LegendItem color={colors.mutedStrong} label={t('legendFree')} bytes={breakdown.freeBytes} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: SPACING.md, gap: SPACING.md },
  header: { gap: 2 },
  numbers: { fontVariant: ['tabular-nums'] },
  meter: { flexDirection: 'row', height: 10, borderRadius: RADII.pill, overflow: 'hidden', gap: 2 },
  legend: { gap: SPACING.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { flex: 1 }
});
