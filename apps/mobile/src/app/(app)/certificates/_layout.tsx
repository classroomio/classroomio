import { Stack } from 'expo-router';

import { certificateCatalog } from '@/feature/certificate/translations/catalog';
import { StackBackButton } from '@/feature/common/components/stack-back-button';
import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { complianceCatalog } from '@/feature/compliance/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function CertificatesLayout() {
  const { colors } = useTheme();
  const t = useTranslations(certificateCatalog);
  const tCompliance = useTranslations(complianceCatalog);

  return (
    <Stack
      screenOptions={({ navigation, route }) => ({
        ...tabStackScreenOptions(colors),
        headerLeft: navigation.getState()?.routes[0]?.key === route.key ? () => <StackBackButton /> : undefined
      })}
    >
      <Stack.Screen name="index" options={{ title: t('screenTitleCertificates') }} />
      <Stack.Screen
        name="[courseId]"
        options={{ title: t('screenTitleCertificate'), headerLargeTitleEnabled: false }}
      />
      <Stack.Screen name="compliance" options={{ title: tCompliance('screenTitle') }} />
    </Stack>
  );
}
