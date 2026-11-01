import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Field, FieldDescription, FieldLabel } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { FONT_FAMILY } from '@/feature/common/constants/typography';
import { SPACING } from '@/feature/common/constants/layout';
import { isCompleteCheckInCode, normalizeCheckInCode } from '@/feature/check-in/helpers/check-in-code';
import { checkInCatalog } from '@/feature/check-in/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type CheckInCodeFormProps = {
  onSubmit: (code: string) => void;
  onFocusChange?: (focused: boolean) => void;
};

export function CheckInCodeForm({ onSubmit, onFocusChange }: CheckInCodeFormProps) {
  const t = useTranslations(checkInCatalog);
  const [code, setCode] = useState('');
  const complete = isCompleteCheckInCode(code);

  const submit = () => {
    if (!complete) return;

    onSubmit(code);
  };

  return (
    <View style={styles.root}>
      <Field>
        <FieldLabel>{t('codeLabel')}</FieldLabel>
        <Input
          value={code}
          onChangeText={(value) => setCode(normalizeCheckInCode(value))}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          returnKeyType="go"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={submit}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          accessibilityLabel={t('codeLabel')}
          style={styles.input}
        />
        <FieldDescription>{t('codeDescription')}</FieldDescription>
      </Field>
      <Button size="lg" disabled={!complete} onPress={submit}>
        <ButtonText>{t('checkIn')}</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.md },
  input: { fontFamily: FONT_FAMILY.semibold, fontSize: 22, letterSpacing: 4, textAlign: 'center' }
});
