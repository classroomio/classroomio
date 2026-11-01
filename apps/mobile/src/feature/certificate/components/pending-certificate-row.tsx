import { Award } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { certificateCatalog } from '@/feature/certificate/translations/catalog';
import type { PendingCertificate } from '@/feature/certificate/types/certificate';
import { Icon } from '@/feature/common/components/icon';
import { Item, ItemChevron, ItemContent, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type PendingCertificateRowProps = {
  pending: PendingCertificate;
  onPress: (pending: PendingCertificate) => void;
};

/** A course whose certificate is earned on completion. */
export function PendingCertificateRow({ pending, onPress }: PendingCertificateRowProps) {
  const t = useTranslations(certificateCatalog);
  const formatters = useFormatters();
  const progress = t('progressComplete', { percent: formatters.percent(pending.progressPercent) });

  return (
    <Item
      onPress={() => onPress(pending)}
      accessibilityLabel={`${pending.courseTitle}, ${progress}`}
      style={styles.item}
    >
      <ItemMedia variant="tile">
        <Icon icon={Award} size={20} tone="subtle" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{pending.courseTitle}</ItemTitle>
        <View style={styles.progress}>
          <Progress value={pending.progressPercent} />
          <Text variant="caption" tone="muted">
            {progress}
          </Text>
        </View>
      </ItemContent>
      <ItemChevron />
    </Item>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: 'flex-start' },
  progress: { gap: 6, marginTop: 6 }
});
