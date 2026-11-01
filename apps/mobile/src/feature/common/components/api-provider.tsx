import { createContext, use, useMemo, type ReactNode } from 'react';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { createApiClient, type ApiClient } from '@/feature/common/api/api-client';
import { getActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { useServer } from '@/feature/server/components/server-provider';

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const { serverUrl } = useServer();
  const { client } = useAuth();

  const api = useMemo(
    () => createApiClient({ serverUrl, getCookie: () => client.getCookie(), getOrgId: getActiveOrgId }),
    [serverUrl, client]
  );

  return <ApiContext value={api}>{children}</ApiContext>;
}

export function useApi() {
  const api = use(ApiContext);
  if (!api) throw new Error('useApi must be used inside ApiProvider');

  return api;
}
