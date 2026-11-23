import { useLocalSearchParams } from 'expo-router';

import { InviteGate } from '@/feature/account/components/invite-gate';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  return <InviteGate kind="organization" token={token} />;
}
