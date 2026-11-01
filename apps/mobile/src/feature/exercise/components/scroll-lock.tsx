import { createContext, use, useState, type ReactNode } from 'react';

const ScrollLockContext = createContext<{ locked: boolean; setLocked: (locked: boolean) => void }>({
  locked: false,
  setLocked: () => {}
});

export function ScrollLock({ children }: { children: (locked: boolean) => ReactNode }) {
  const [locked, setLocked] = useState(false);

  return <ScrollLockContext value={{ locked, setLocked }}>{children(locked)}</ScrollLockContext>;
}

export function useScrollLock() {
  return use(ScrollLockContext).setLocked;
}
