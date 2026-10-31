'use client';

import { useCallback, useState } from 'react';
import { joinUrl, setSearchParam } from '@/lib/search-params';

/**
 * Mirrors a piece of UI state into the URL query string so a reload, a bookmark
 * or a shared link reopen the exact same view.
 *
 * The initial value arrives from the server (page `searchParams`), which keeps
 * the first render hydration-safe. Writes go through `window.history.replaceState`,
 * integrated with the Next.js router, so no server round trip happens per keystroke.
 */
export function useUrlState(name: string, initialValue: string, defaultValue = '') {
  const [value, setValue] = useState(initialValue);

  const setUrlState = useCallback(
    (next: string) => {
      setValue(next);
      if (typeof window === 'undefined') return;
      const query = setSearchParam(window.location.search, name, next, defaultValue);
      window.history.replaceState(null, '', joinUrl(window.location.pathname, query));
    },
    [defaultValue, name]
  );

  return [value, setUrlState] as const;
}
