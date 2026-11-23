import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { inviteHref, takePendingInvite } from '@/feature/account/helpers/pending-invite-store';
import { useAuth } from '@/feature/auth/components/auth-provider';

/**
 * Once someone signs in after opening an invite signed out, reopens that invite and accepts it. Signing in replaces the
 * screen stack, so the invite screen they started on is gone by then.
 */
export function PendingInviteRedirect() {
  const { userId } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!userId) return;

    const invite = takePendingInvite();
    if (invite) router.replace(inviteHref(invite, true));
  }, [userId, pathname]);

  return null;
}
