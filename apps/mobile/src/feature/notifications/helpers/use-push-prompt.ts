import { useEffect, useState } from 'react';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { useNotificationPreferencesQuery } from '@/feature/notifications/api/notification-preferences';
import { PUSH_PROMPT_DELAY_MS } from '@/feature/notifications/constants/notifications';
import {
  recordAppSession,
  shouldOfferPushPrompt,
  snoozePushPrompt
} from '@/feature/notifications/helpers/push-prompt-store';
import {
  refreshPushPermission,
  requestPushPermission,
  usePushPermission
} from '@/feature/notifications/helpers/push-permission-store';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

/**
 * Decides when to show the push pre-prompt: on a later session than the first, a few seconds after the app settles,
 * only while the system permission is still undecided and the server can deliver push.
 */
export function usePushPrompt() {
  const { userId } = useAuth();
  const { org } = useActiveOrg();
  const permission = usePushPermission();
  const preferences = useNotificationPreferencesQuery();
  const pushAvailable = preferences.data?.pushAvailable === true;
  const [open, setOpen] = useState(false);
  const signedIn = Boolean(userId && org);

  useEffect(() => {
    if (!signedIn) return;

    recordAppSession();
    void refreshPushPermission();
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || !pushAvailable || permission !== 'undetermined' || !shouldOfferPushPrompt()) return;

    const timer = setTimeout(() => setOpen(true), PUSH_PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [signedIn, pushAvailable, permission]);

  return {
    open,
    orgName: org?.name ?? null,
    onOpenChange: (next: boolean) => {
      if (!next) snoozePushPrompt();
      setOpen(next);
    },
    onAllow: () => {
      setOpen(false);
      snoozePushPrompt();
      void requestPushPermission();
    }
  };
}
