declare global {
  interface Window {
    $ujq: unknown[];
    uj: {
      init: (
        appId: string,
        options?: {
          widget?: boolean;
          position?: 'left' | 'right';
          theme?: 'auto' | 'light' | 'dark';
        }
      ) => void;
      identify: (user: { id: string; email?: string; firstName?: string; lastName?: string; avatar?: string }) => void;
      [method: string]: (...args: unknown[]) => void;
    };
  }
}

export {};
