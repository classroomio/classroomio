import { useState } from 'react';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { GoogleMark } from '@/feature/brand/components/google-mark';
import { authErrorMessage } from '@/feature/auth/helpers/auth-error';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function GoogleSignInButton() {
  const { client } = useAuth();
  const t = useTranslations(authCatalog);
  const [pending, setPending] = useState(false);

  const showFailure = (description: string) =>
    showToast({ tone: 'danger', title: t('googleSignInFailedTitle'), description });

  const signIn = async () => {
    setPending(true);
    try {
      const result = await client.signIn.social({ provider: 'google', callbackURL: '/', errorCallbackURL: '/' });
      if (result.error) showFailure(authErrorMessage(result.error, t('googleSignInFailedDescription')));
    } catch {
      showFailure(t('googleSignInFailedDescription'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant="outline" size="lg" disabled={pending} onPress={signIn}>
      {pending ? (
        <ButtonSpinner />
      ) : (
        <>
          <GoogleMark size={18} />
          <ButtonText>{t('continueWithProvider', { provider: 'Google' })}</ButtonText>
        </>
      )}
    </Button>
  );
}
