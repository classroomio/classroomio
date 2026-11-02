import { useEffect, useState } from 'react';

/** The current time in milliseconds, refreshed every `intervalMs` while the component is mounted. */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
