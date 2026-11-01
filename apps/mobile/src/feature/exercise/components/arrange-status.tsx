import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type ArrangeStatusProps = { answered: boolean; confirmLabel: string; onConfirm: () => void };

export function ArrangeStatus({ answered, confirmLabel, onConfirm }: ArrangeStatusProps) {
  const t = useTranslations(exerciseCatalog);

  if (answered) {
    return (
      <View style={styles.row}>
        <Icon icon={Check} size={16} tone="success" />
        <Text variant="caption" tone="muted">
          {t('orderSaved')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted" style={styles.hint}>
        {t('arrangeHint')}
      </Text>
      <Button variant="secondary" size="sm" onPress={onConfirm}>
        <ButtonIcon icon={Check} />
        <ButtonText>{confirmLabel}</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  hint: { flex: 1 }
});
