import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CERTIFICATE_ASPECT_RATIO } from '@/feature/certificate/constants/certificate-layout';
import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

/** A frame at the certificate's aspect ratio. */
export function CertificatePreview({ children }: { children: ReactNode }) {
  const { colors, elevation } = useTheme();

  return (
    <View style={[styles.frame, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised]}>
      {children}
    </View>
  );
}

export function CertificatePreviewImage({ uri, label }: { uri: string; label: string }) {
  return (
    <Image
      source={{ uri }}
      contentFit="contain"
      transition={160}
      style={StyleSheet.absoluteFill}
      accessibilityLabel={label}
      accessibilityIgnoresInvertColors
    />
  );
}

export function CertificatePreviewLoading() {
  return <Skeleton height={0} radius={0} style={styles.fill} />;
}

type CertificatePreviewMessageProps = { icon: AppIcon; title: string; description?: string; children?: ReactNode };

export function CertificatePreviewMessage({ icon, title, description, children }: CertificatePreviewMessageProps) {
  const { colors } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, styles.message, { backgroundColor: colors.muted }]}>
      <Icon icon={icon} size={22} tone="muted" />
      <Text variant="captionStrong" style={styles.centered}>
        {title}
      </Text>
      {description ? (
        <Text variant="caption" tone="muted" style={styles.centered}>
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: CERTIFICATE_ASPECT_RATIO,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  fill: { height: '100%' },
  message: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxs,
    padding: SPACING.lg
  },
  centered: { textAlign: 'center', maxWidth: 280 }
});
