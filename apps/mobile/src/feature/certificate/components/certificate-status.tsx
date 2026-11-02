import { StyleSheet, View } from 'react-native';

import { CERTIFICATE_STATUS_DISPLAY } from '@/feature/certificate/constants/certificate-status';
import { certificateStatusText, useCertificateCopy } from '@/feature/certificate/helpers/certificate-copy';
import type { Certificate } from '@/feature/certificate/types/certificate';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';

export function CertificateStatus({ certificate }: { certificate: Pick<Certificate, 'status' | 'expiresAt'> }) {
  const display = CERTIFICATE_STATUS_DISPLAY[certificate.status];
  const copy = useCertificateCopy();

  return (
    <View style={styles.status}>
      <Icon icon={display.icon} size={15} tone={display.tone} />
      <Text variant="captionStrong" tone={display.tone} numberOfLines={1} style={styles.text}>
        {certificateStatusText(certificate, copy)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { flexShrink: 1 }
});
