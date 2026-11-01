import { useRef, useState } from 'react';

import { useSsoDiscovery } from '@/feature/auth/api/sso';
import { isEmail } from '@/feature/auth/helpers/email';
import type { SsoDiscovery } from '@/feature/auth/types/sso';

/** Tracks whether the typed email's domain enforces SSO. Lookup failures count as not enforced; the server decides at sign-in. */
export function useSsoRequirement() {
  const discover = useSsoDiscovery();
  const latestEmail = useRef('');
  const [requirement, setRequirement] = useState<SsoDiscovery | null>(null);

  const check = async (email: string) => {
    latestEmail.current = email;
    if (!isEmail(email)) {
      setRequirement(null);
      return null;
    }

    let required: SsoDiscovery | null = null;
    try {
      const discovery = await discover(email);
      required = discovery.ssoRequired && discovery.ssoAvailable ? discovery : null;
    } catch {
      required = null;
    }

    if (latestEmail.current === email) setRequirement(required);

    return required;
  };

  const clear = () => {
    latestEmail.current = '';
    setRequirement(null);
  };

  return { requirement, check, clear };
}
