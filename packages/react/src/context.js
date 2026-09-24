import { createContext, useContext } from 'react';

/**
 * Null rather than a default value on purpose: a hook used outside the
 * provider should say so, not quietly return the fallback and leave someone
 * wondering why their edits never appear.
 */
export const LiveEditContext = createContext(null);

export const useLiveEdit = () => useContext(LiveEditContext);
