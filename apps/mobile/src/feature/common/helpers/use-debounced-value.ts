import { useEffect, useState } from 'react';

/** `value` once it has stopped changing for `delayMs`, for server-backed search boxes. */
export function useDebouncedValue<Value>(value: Value, delayMs = 300) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
