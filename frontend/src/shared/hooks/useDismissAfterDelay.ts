import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * When `value` differs from `initial`, resets to `initial` after `delayMs`.
 * For transient UI messages only (`string | null`); not for arbitrary object state.
 */
export const useDismissAfterDelay = <T extends string | null>(
  initial: T,
  delayMs: number
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    if (value === initial) return;
    const timer = setTimeout(() => setValue(initial), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, initial]);

  return [value, setValue];
};
