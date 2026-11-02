import { useState } from 'react';

import { signInWithSso } from '@/feature/auth/api/sso';
import { useAuth } from '@/feature/auth/components/auth-provider';
import { errorHaptic } from '@/feature/common/helpers/haptics';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function useSsoSignIn() {
  const { client } = useAuth();
  const t = useTranslations(authCatalog);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (email: string, providerId: string | null, providerName?: string | null) => {
    setPending(true);
    setError(null);

    try {
      const { signedIn } = await signInWithSso(client, { email, providerId });
      if (!signedIn) setError(t('ssoDidNotFinish', { provider: providerName || t('singleSignOn') }));
    } catch (cause) {
      errorHaptic();
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  };

  return { start, pending, error, clearError: () => setError(null) };
}
