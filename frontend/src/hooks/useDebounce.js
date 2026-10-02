/**
 * Debounces a changing value — used for search inputs with
 * SEARCH_DEBOUNCE_MS from constants.
 */
import { useEffect, useState } from 'react';

export const useDebounce = (value, delayMs) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};

export default useDebounce;
