import { ArrowDownToLine, Award } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { certificateStatusText, useCertificateCopy } from '@/feature/certificate/helpers/certificate-copy';
import type { Certificate } from '@/feature/certificate/types/certificate';
import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { Text } from '@/feature/common/components/text';

import { CertificateStatus } from './certificate-status';

type CertificateRowProps = {
  certificate: Certificate;
  saved: boolean;
  onPress: (certificate: Certificate) => void;
};

export function CertificateRow({ certificate, saved, onPress }: CertificateRowProps) {
  const copy = useCertificateCopy();
  const issued = copy.t('issuedOn', { date: copy.date(certificate.issuedAt) });

  return (
    <Item
      onPress={() => onPress(certificate)}
      accessibilityLabel={`${certificate.courseTitle}. ${issued}. ${certificateStatusText(certificate, copy)}`}
      style={styles.item}
    >
      <ItemMedia variant="tile">
        <Icon icon={Award} size={20} tone={certificate.status === 'expired' ? 'muted' : 'ink'} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{certificate.courseTitle}</ItemTitle>
        <ItemDescription numberOfLines={1}>
          {issued} · {certificate.certificateId}
        </ItemDescription>
        <View style={styles.meta}>
          <CertificateStatus certificate={certificate} />
          {saved && (
            <View style={styles.saved}>
              <Icon icon={ArrowDownToLine} size={13} tone="muted" />
              <Text variant="micro" tone="muted">
                {copy.t('savedOnThisDevice')}
              </Text>
            </View>
          )}
        </View>
      </ItemContent>
      <ItemChevron />
    </Item>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: 'flex-start' },
  meta: { gap: 4, marginTop: 2 },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 4 }
});
