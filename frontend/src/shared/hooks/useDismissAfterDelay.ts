import { useEffect, useState } from 'react';

export function useDismissAfterDelay<T>(initial: T, delayMs: number): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => setValue(initial), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, initial]);

  return [value, setValue];
}
