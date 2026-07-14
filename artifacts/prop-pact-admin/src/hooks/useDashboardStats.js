/**
 * useDashboardStats
 *
 * Establishes real-time Firestore listeners for every Dashboard card.
 * Returns null for fields that are still loading and undefined for fields
 * that errored (permission denied, collection not found, etc.).
 *
 * Listener optimisations:
 *  - legalRequests uses ONE full-collection listener to derive both
 *    pendingLegal (client-side filter) and legalFeeTotal (sum), avoiding
 *    a second read on the same collection.
 *  - subscriptions may not exist; an empty snapshot is treated as ₹0 revenue.
 *  - All listeners are torn down on unmount via the returned unsubscribe array.
 */

import { useEffect, useReducer } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const INITIAL_STATE = {
  properties:          null, // null = loading
  projects:            null,
  pendingVerification: null,
  pendingLegal:        null,
  users:               null,
  rentTotal:           null,
  legalFeeTotal:       null,
  subscriptionTotal:   null,
};

function reducer(state, { key, value }) {
  return { ...state, [key]: value };
}

export function useDashboardStats() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    const unsubs = [];

    /**
     * Helper: attach a real-time listener.
     * On error the key is set to `undefined` so the UI shows "--".
     * For revenue components, errorValue = 0 so partial sums still work.
     */
    function listen(firestoreQuery, key, transform, errorValue = undefined) {
      const unsub = onSnapshot(
        firestoreQuery,
        (snap) => dispatch({ key, value: transform(snap) }),
        (err) => {
          // Permission denied or missing index — degrade gracefully
          console.warn(`[useDashboardStats] ${key}:`, err.code, err.message);
          dispatch({ key, value: errorValue });
        }
      );
      unsubs.push(unsub);
    }

    // ── Simple counts ────────────────────────────────────────────────────────
    listen(collection(db, 'properties'), 'properties', (s) => s.size);
    listen(collection(db, 'projects'),   'projects',   (s) => s.size);
    listen(collection(db, 'users'),      'users',      (s) => s.size);

    // ── Filtered pending counts ──────────────────────────────────────────────
    listen(
      query(collection(db, 'verificationRequests'), where('status', '==', 'pending')),
      'pendingVerification',
      (s) => s.size
    );

    // ── legalRequests: ONE listener → pending count + fee sum ────────────────
    const unsub = onSnapshot(
      collection(db, 'legalRequests'),
      (snap) => {
        let pending = 0;
        let feeSum  = 0;
        snap.forEach((doc) => {
          const d = doc.data();
          const status = (d.status ?? '').toLowerCase();
          if (status === 'pending') pending++;
          // Try common field names for the legal fee
          feeSum += Number(d.legalFee) || Number(d.fee) || Number(d.amount) || 0;
        });
        dispatch({ key: 'pendingLegal',   value: pending });
        dispatch({ key: 'legalFeeTotal',  value: feeSum  });
      },
      (err) => {
        console.warn('[useDashboardStats] legalRequests:', err.code, err.message);
        dispatch({ key: 'pendingLegal',  value: undefined });
        dispatch({ key: 'legalFeeTotal', value: 0 }); // treat as ₹0 in revenue
      }
    );
    unsubs.push(unsub);

    // ── Revenue: rent payments sum ───────────────────────────────────────────
    listen(
      collection(db, 'rentPayments'),
      'rentTotal',
      (s) => s.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0),
      0 // empty / missing collection → ₹0
    );

    // ── Revenue: subscription sum ────────────────────────────────────────────
    listen(
      collection(db, 'subscriptions'),
      'subscriptionTotal',
      (s) => s.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0),
      0 // subscriptions collection may not exist yet → ₹0
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  // ── Derive combined revenue ──────────────────────────────────────────────
  // null = still loading (any component loading → overall loading)
  // undefined = one component errored but the rest are numbers → still sum them
  const { rentTotal, legalFeeTotal, subscriptionTotal } = state;

  let revenue = null;
  const allLoading = rentTotal === null && legalFeeTotal === null && subscriptionTotal === null;
  if (!allLoading) {
    // At least one has resolved; treat null as 0 (still loading = assume 0 for now)
    // treat undefined as 0 (errored component = 0)
    revenue = (rentTotal ?? 0) + (legalFeeTotal ?? 0) + (subscriptionTotal ?? 0);
  }

  return {
    properties:          state.properties,
    projects:            state.projects,
    pendingVerification: state.pendingVerification,
    pendingLegal:        state.pendingLegal,
    users:               state.users,
    revenue,
  };
}
