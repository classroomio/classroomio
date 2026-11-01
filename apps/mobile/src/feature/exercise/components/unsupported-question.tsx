import * as WebBrowser from 'expo-web-browser';
import { Globe } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useExerciseSession } from '@/feature/exercise/components/exercise-session';
import { exerciseWebUrlOf } from '@/feature/exercise/helpers/web-url';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type UnsupportedQuestionProps = { reason?: string };

export function UnsupportedQuestion({ reason }: UnsupportedQuestionProps) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const { org } = useActiveOrg();
  const { courseId, exerciseId } = useExerciseSession();

  return (
    <View style={[styles.box, { backgroundColor: colors.sand, borderColor: colors.border }]}>
      <Text variant="label">{t('unsupportedTitle')}</Text>
      <Text variant="caption" tone="muted">
        {`${reason ?? t('unsupportedReason')} ${t('unsupportedInstruction')}`}
      </Text>
      <Button
        variant="outline"
        size="sm"
        style={styles.button}
        onPress={() => void WebBrowser.openBrowserAsync(exerciseWebUrlOf(org, courseId, exerciseId))}
      >
        <ButtonIcon icon={Globe} />
        <ButtonText>{t('openInBrowser')}</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: SPACING.xs,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  button: { alignSelf: 'flex-start', marginTop: SPACING.xxs }
});
