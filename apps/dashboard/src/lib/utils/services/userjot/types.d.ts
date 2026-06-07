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
      identify: (
        user: { id: string; email?: string; firstName?: string; lastName?: string; avatar?: string } | null
      ) => void;
      showWidget: (options: { section: 'feedback' | 'roadmap' | 'updates' }) => void;
      [method: string]: (...args: unknown[]) => void;
    };
  }
}

export {};
