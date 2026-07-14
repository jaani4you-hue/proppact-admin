/**
 * useNotificationCount
 *
 * Lightweight real-time listener on the `notifications` collection.
 * Returns the document count as a number, or null while loading.
 * Used by the Header bell badge.
 */

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

export function useNotificationCount() {
  const [count, setCount] = useState(null); // null = loading

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'notifications'),
      (snap) => setCount(snap.size),
      (err) => {
        console.warn('[useNotificationCount] notifications:', err.code, err.message);
        setCount(0);
      }
    );
    return () => unsub();
  }, []);

  return count;
}
