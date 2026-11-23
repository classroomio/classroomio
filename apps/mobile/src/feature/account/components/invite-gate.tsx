import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { InviteAcceptance } from '@/feature/account/components/invite-acceptance';
import { InviteSignUp } from '@/feature/account/components/invite-sign-up';
import type { InviteKind } from '@/feature/account/types/account';
import { useAuth } from '@/feature/auth/components/auth-provider';

/**
 * An invite link, signed in or out. Signed out, it offers sign-up. An account created or signed into after opening the
 * link accepts the invite straight away.
 */
export function InviteGate({ kind, token }: { kind: InviteKind; token: string }) {
  const { userId, isPending } = useAuth();
  const { accept } = useLocalSearchParams<{ accept?: string }>();
  const [openedSignedOut, setOpenedSignedOut] = useState<boolean | null>(isPending ? null : !userId);

  if (openedSignedOut === null && !isPending) setOpenedSignedOut(!userId);

  if (isPending) return null;

  if (!userId) return <InviteSignUp invite={{ kind, token }} />;

  return <InviteAcceptance kind={kind} token={token} autoAccept={openedSignedOut === true || accept === '1'} />;
}
