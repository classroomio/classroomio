import { Minus, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon } from '@/feature/common/components/button';
import { InputGroup, InputGroupInput } from '@/feature/common/components/input';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { teachCatalog } from '@/feature/teach/translations/catalog';

type ScoreStepperProps = {
  value: string;
  max: number;
  onChange: (value: string) => void;
  accessibilityLabel: string;
};

export function ScoreStepper({ value, max, onChange, accessibilityLabel }: ScoreStepperProps) {
  const t = useTranslations(teachCatalog);
  const current = Number.parseInt(value, 10);
  const numeric = Number.isNaN(current) ? null : current;

  const step = (delta: number) => {
    const base = numeric ?? (delta > 0 ? -1 : max + 1);
    const next = Math.min(max, Math.max(0, base + delta));
    selectionHaptic();
    onChange(String(next));
  };

  return (
    <View style={styles.row}>
      <Button
        variant="outline"
        size="icon"
        haptic={false}
        accessibilityLabel={t('lowerScore')}
        disabled={numeric !== null && numeric <= 0}
        onPress={() => step(-1)}
      >
        <ButtonIcon icon={Minus} />
      </Button>
      <InputGroup style={styles.field}>
        <InputGroupInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          maxLength={4}
          placeholder="–"
          selectTextOnFocus
          accessibilityLabel={accessibilityLabel}
          style={styles.input}
        />
      </InputGroup>
      <Button
        variant="outline"
        size="icon"
        haptic={false}
        accessibilityLabel={t('raiseScore')}
        disabled={numeric !== null && numeric >= max}
        onPress={() => step(1)}
      >
        <ButtonIcon icon={Plus} />
      </Button>
      <Text variant="caption" tone="muted" style={styles.max}>
        {t('ofMax', { max })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  field: { width: 64, minHeight: 44 },
  input: { textAlign: 'center', paddingHorizontal: SPACING.xs, fontVariant: ['tabular-nums'] },
  max: { marginLeft: SPACING.xxs }
});
