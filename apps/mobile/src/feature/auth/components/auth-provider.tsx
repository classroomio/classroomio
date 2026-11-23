import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useMemo, type ReactNode } from 'react';

import { createClassroomioAuthClient, type AuthClient } from '@/feature/auth/api/auth-client';
import { clearQuerySnapshots } from '@/feature/common/helpers/query-snapshot';
import { clearOfflineData } from '@/feature/offline/helpers/clear-offline-data';
import { clearActiveOrg } from '@/feature/org/helpers/active-org-store';
import { unregisterPushToken } from '@/feature/notifications/helpers/push-registration-store';
import { useServer } from '@/feature/server/components/server-provider';

type AuthContextValue = {
  client: AuthClient;
  userId: string | null;
  isPending: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { serverUrl } = useServer();
  const queryClient = useQueryClient();
  const client = useMemo(() => createClassroomioAuthClient(serverUrl), [serverUrl]);
  const session = client.useSession();

  const signOut = async () => {
    const userId = session.data?.user.id ?? null;
    const cleanups = await Promise.allSettled([unregisterPushToken(), clearOfflineData(userId)]);
    for (const cleanup of cleanups) {
      if (cleanup.status === 'rejected') console.error('signOut cleanup error:', cleanup.reason);
    }

    await client.signOut();
    clearActiveOrg();
    queryClient.clear();
    await clearQuerySnapshots();
  };

  return (
    <AuthContext value={{ client, userId: session.data?.user.id ?? null, isPending: session.isPending, signOut }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');

  return context;
}
