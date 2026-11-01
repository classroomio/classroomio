import { createContext, use, useState, type ReactNode } from 'react';

import { DEFAULT_SERVER_URL } from '@/feature/server/constants/server';
import { readServerUrl, saveServerUrl } from '@/feature/server/helpers/server-url';

type ServerContextValue = {
  serverUrl: string;
  isCustom: boolean;
  setServerUrl: (url: string | null) => Promise<void>;
};

const ServerContext = createContext<ServerContextValue | null>(null);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [serverUrl, setServerUrlState] = useState(readServerUrl);

  const setServerUrl = async (url: string | null) => {
    await saveServerUrl(url);
    setServerUrlState(url ?? DEFAULT_SERVER_URL);
  };

  return (
    <ServerContext value={{ serverUrl, isCustom: serverUrl !== DEFAULT_SERVER_URL, setServerUrl }}>
      {children}
    </ServerContext>
  );
}

export function useServer() {
  const context = use(ServerContext);
  if (!context) throw new Error('useServer must be used inside ServerProvider');

  return context;
}
