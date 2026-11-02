import type { Client } from '@cio/api/rpc-types';
import { hc } from 'hono/client';

type ApiClientOptions = {
  serverUrl: string;
  getCookie: () => string | Promise<string>;
  getOrgId: () => string | null;
};

export function createApiClient({ serverUrl, getCookie, getOrgId }: ApiClientOptions): Client {
  return hc(serverUrl, {
    headers: async () => {
      const cookie = await getCookie();
      const orgId = getOrgId();
      const headers: Record<string, string> = { cookie };
      if (orgId) headers['cio-org-id'] = orgId;

      return headers;
    }
  }) as unknown as Client;
}

export type ApiClient = Client;
