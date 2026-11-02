import { useLocalSearchParams } from 'expo-router';

import { InviteAcceptance } from '@/feature/account/components/invite-acceptance';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  return <InviteAcceptance kind="organization" token={token} />;
}
