import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { Image } from 'expo-image';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { CERTIFICATE_STATUS_DISPLAY } from '@/feature/certificate/constants/certificate-status';
import { certificateStatusText, useCertificateCopy } from '@/feature/certificate/helpers/certificate-copy';
import type { Certificate } from '@/feature/certificate/types/certificate';
import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { withAlpha } from '@/feature/common/helpers/color';
import { useTheme } from '@/feature/common/helpers/use-theme';

const CertificateCardContext = createContext<Certificate | null>(null);

function useCardCertificate() {
  const certificate = use(CertificateCardContext);
  if (!certificate) throw new Error('CertificateCard parts must be inside CertificateCard');

  return certificate;
}

type CertificateCardProps = {
  certificate: Certificate;
  onPress?: (certificate: Certificate) => void;
  children: ReactNode;
};

/** An earned certificate as a wallet card over the course artwork, or the organization colour when there is none. */
export function CertificateCard({ certificate, onPress, children }: CertificateCardProps) {
  const { colors, elevation } = useTheme();
  const copy = useCertificateCopy();
  const expired = certificate.status === 'expired';
  const label = `${certificate.courseTitle}. ${copy.t('issuedOn', { date: copy.date(certificate.issuedAt) })}. ${certificateStatusText(certificate, copy)}`;

  const card = (
    <View style={[styles.card, { backgroundColor: colors.primary }, elevation.raised]}>
      {certificate.courseImage ? (
        <Image
          source={{ uri: certificate.courseImage }}
          recyclingKey={certificate.courseId}
          contentFit="cover"
          blurRadius={28}
          transition={150}
          style={StyleSheet.absoluteFill}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.watermark} pointerEvents="none">
          <Icon icon={MedalIcon} size={168} color={withAlpha(colors.onSolid, 0.12)} weight="fill" />
        </View>
      )}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="certificate-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.artworkScrim} stopOpacity={expired ? 0.7 : 0.45} />
            <Stop offset="0.5" stopColor={colors.artworkScrim} stopOpacity={expired ? 0.65 : 0.3} />
            <Stop offset="1" stopColor={colors.artworkScrim} stopOpacity={expired ? 0.9 : 0.75} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#certificate-scrim)" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );

  return (
    <CertificateCardContext value={certificate}>
      {onPress ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={label}
          scaleTo={0.98}
          onPress={() => {
            tapHaptic();
            onPress(certificate);
          }}
        >
          {card}
        </PressableScale>
      ) : (
        <View accessible accessibilityLabel={label}>
          {card}
        </View>
      )}
    </CertificateCardContext>
  );
}

export function CertificateCardHeader({ issuer, saved = false }: { issuer?: string; saved?: boolean }) {
  const { colors } = useTheme();
  const { t } = useCertificateCopy();

  return (
    <View style={styles.header}>
      <View style={[styles.seal, { backgroundColor: withAlpha(colors.onSolid, 0.18) }]}>
        <Icon icon={MedalIcon} size={18} color={colors.onSolid} weight="fill" />
      </View>
      {issuer ? (
        <Text variant="captionStrong" numberOfLines={1} style={[styles.issuer, { color: colors.onSolid }]}>
          {issuer}
        </Text>
      ) : (
        <View style={styles.issuer} />
      )}
      {saved ? (
        <View accessible accessibilityLabel={t('savedOnThisDevice')}>
          <Icon icon={DownloadSimpleIcon} size={18} color={withAlpha(colors.onSolid, 0.85)} weight="bold" />
        </View>
      ) : null}
    </View>
  );
}

export function CertificateCardBody() {
  const certificate = useCardCertificate();
  const { colors } = useTheme();
  const copy = useCertificateCopy();
  const display = CERTIFICATE_STATUS_DISPLAY[certificate.status];
  const subdued = withAlpha(colors.onSolid, 0.78);
  const statusColor =
    certificate.status === 'valid' ? subdued : colors[display.tone === 'danger' ? 'danger' : 'warning'];

  return (
    <View style={styles.body}>
      <Text variant="title" numberOfLines={2} style={{ color: colors.onSolid }}>
        {certificate.courseTitle}
      </Text>
      <Text variant="caption" numberOfLines={1} style={{ color: subdued }}>
        {`${copy.t('issuedOn', { date: copy.date(certificate.issuedAt) })} · ${certificate.certificateId}`}
      </Text>
      <View style={styles.status}>
        <Icon icon={display.icon} size={15} color={statusColor} weight="fill" />
        <Text variant="captionStrong" numberOfLines={1} style={[styles.statusText, { color: statusColor }]}>
          {certificateStatusText(certificate, copy)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.62,
    borderRadius: RADII.sheet,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  watermark: { position: 'absolute', right: -28, bottom: -36 },
  content: { flex: 1, justifyContent: 'space-between', padding: SPACING.md + 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  seal: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill
  },
  issuer: { flex: 1 },
  body: { gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.xxs },
  statusText: { flexShrink: 1 }
});
