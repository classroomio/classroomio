declare global {
  interface Window {
    $ujq: unknown[];
    uj: {
      init: (
        projectId: string,
        options?: {
          widget?:
            | boolean
            | {
                launcher?: boolean;
                position?: 'left' | 'right';
                theme?: 'auto' | 'light' | 'dark';
                whispers?: boolean;
              };
          locale?: string;
        }
      ) => void;
      identify: (payload: {
        user: { id: string; email?: string; firstName?: string; lastName?: string; avatar?: string };
      }) => void;
      logout: () => void;
      open: (options?: { to: 'home' | 'feedback' | 'roadmap' | 'updates' | 'messages' | 'notifications' }) => void;
      [method: string]: (...args: unknown[]) => void;
    };
  }
}

export {};
