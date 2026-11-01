import { router } from 'expo-router';
import { KeyRound } from 'lucide-react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function SsoSignInButton() {
  const t = useTranslations(authCatalog);

  return (
    <Button variant="outline" size="lg" onPress={() => router.push('/sso')}>
      <ButtonIcon icon={KeyRound} />
      <ButtonText>{t('signInWithSso')}</ButtonText>
    </Button>
  );
}
