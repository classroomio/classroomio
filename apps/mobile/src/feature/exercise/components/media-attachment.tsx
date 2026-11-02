import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Progress } from '@/feature/common/components/progress';
import { Text, type TextTone } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';

export function MediaAttachment({ children }: { children: ReactNode }) {
  const { colors, elevation } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised]}>
      {children}
    </View>
  );
}

export function MediaAttachmentRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function MediaAttachmentThumb({ uri, icon }: { uri?: string | null; icon: AppIcon }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.thumb, { backgroundColor: colors.muted }]}>
      {uri ? (
        <Image source={{ uri }} contentFit="cover" transition={120} style={StyleSheet.absoluteFill} />
      ) : (
        <Icon icon={icon} size={20} tone="muted" />
      )}
    </View>
  );
}

type MediaAttachmentContentProps = { title: string; description?: string; tone?: TextTone };

export function MediaAttachmentContent({ title, description, tone = 'muted' }: MediaAttachmentContentProps) {
  return (
    <View style={styles.content}>
      <Text variant="label" numberOfLines={1}>
        {title}
      </Text>
      {description ? (
        <Text variant="caption" tone={tone} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export function MediaAttachmentProgress({ value }: { value: number }) {
  const format = useFormatters();

  return (
    <View style={styles.progress}>
      <View style={styles.progressBar}>
        <Progress value={value * 100} />
      </View>
      <Text variant="micro" tone="muted" style={styles.percent}>
        {format.percent(value * 100)}
      </Text>
    </View>
  );
}

export function MediaAttachmentActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  thumb: {
    width: 56,
    height: 44,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  },
  content: { flex: 1, gap: 2 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  progressBar: { flex: 1 },
  percent: { minWidth: 34, textAlign: 'right', fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }
});
