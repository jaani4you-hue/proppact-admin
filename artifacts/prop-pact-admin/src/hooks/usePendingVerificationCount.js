import { useState, useEffect } from 'react';
import { subscribeToPendingCount } from '../services/verificationService.js';

/**
 * Returns the live count of pending verifications for the sidebar badge.
 * Returns null while the first snapshot hasn't arrived yet.
 */
export function usePendingVerificationCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const unsub = subscribeToPendingCount((n) => setCount(n));
    return () => unsub();
  }, []);

  return count;
}
