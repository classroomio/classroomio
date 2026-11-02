import { StyleSheet, View } from 'react-native';

import { certificateCatalog } from '@/feature/certificate/translations/catalog';
import type { PendingCertificate } from '@/feature/certificate/types/certificate';
import { Item, ItemActions, ItemChevron, ItemContent, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { CourseThumbnail } from '@/feature/course/components/course-thumbnail';
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
    <Item onPress={() => onPress(pending)} accessibilityLabel={`${pending.courseTitle}, ${progress}`}>
      <ItemMedia>
        <CourseThumbnail uri={pending.courseImage} size={52} recyclingKey={pending.courseId} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{pending.courseTitle}</ItemTitle>
        <View style={styles.progress}>
          <View style={styles.track}>
            <Progress value={pending.progressPercent} />
          </View>
          <Text variant="micro" tone="muted" style={styles.percent}>
            {progress}
          </Text>
        </View>
      </ItemContent>
      <ItemActions>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xxs },
  track: { flex: 1 },
  percent: { fontVariant: ['tabular-nums'] }
});
