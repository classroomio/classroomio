import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import type { CheckInTarget } from '@/feature/check-in/helpers/check-in-code';
import { checkInCatalog } from '@/feature/check-in/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { CheckInCodeForm } from './check-in-code-form';
import { CheckInScanner } from './check-in-scanner';

type CheckInScanProps = {
  /** The lesson a typed code is for; without one only scanning is offered, since the QR code carries the lesson. */
  lessonId: string | null;
  onSubmit: (target: CheckInTarget) => void;
};

export function CheckInScan({ lessonId, onSubmit }: CheckInScanProps) {
  const t = useTranslations(checkInCatalog);
  const { colors } = useTheme();
  const [typing, setTyping] = useState(false);

  return (
    <KeyboardAwareScrollView
      bottomOffset={SPACING.xl}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heading}>
        <Text variant="title" accessibilityRole="header">
          {t('scanTitle')}
        </Text>
        <Text tone="muted">{t('scanDescription')}</Text>
      </View>

      <CheckInScanner paused={typing} onScan={onSubmit} />

      {lessonId ? (
        <View style={styles.section}>
          <Text variant="subheading" accessibilityRole="header">
            {t('typeCodeTitle')}
          </Text>
          <CheckInCodeForm onFocusChange={setTyping} onSubmit={(code) => onSubmit({ lessonId, code })} />
        </View>
      ) : (
        <Text variant="caption" tone="muted">
          {t('typeCodeFromLesson')}
        </Text>
      )}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.md, paddingBottom: SPACING.xxxl, gap: SPACING.xl },
  heading: { gap: SPACING.xxs },
  section: { gap: SPACING.sm }
});
