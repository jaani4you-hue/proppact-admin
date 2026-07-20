/**
 * activityLogService — central helper for writing to the `adminLogs` Firestore collection.
 *
 * Usage:
 *   import { logActivity } from '../services/activityLogService.js';
 *   await logActivity({ action: 'Tenant created', label: tenant.fullName, module: 'Tenants' });
 *
 * Firestore schema (adminLogs document):
 *   activity  : string  — human-readable description
 *   user      : string  — 'Admin' (auth integration in Module 6)
 *   module    : string  — e.g. 'Tenants' | 'Properties' | 'Rent' …
 *   status    : string  — 'Approved' | 'Rejected' | 'Info'
 *   createdAt : serverTimestamp()
 *   date      : string  — dd MMM yyyy (for legacy consumers)
 *   time      : string  — HH:MM (for legacy consumers)
 */
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const COLLECTION = 'adminLogs';

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * @param {{ action: string, label?: string, module: string, status?: 'Approved'|'Rejected'|'Info' }} opts
 */
export async function logActivity({ action, label = '', module: mod = '—', status = 'Info' } = {}) {
  try {
    const now = new Date();
    await addDoc(collection(db, COLLECTION), {
      activity : label ? `${action}: ${label}` : action,
      user     : 'Admin',
      module   : mod,
      status,
      createdAt: serverTimestamp(),
      // Legacy fields kept for useActivityLog backward compat
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (err) {
    console.warn('[activityLogService] Failed to write log:', err.message);
  }
}

// ── Real-time list for ActivityLogPage ────────────────────────────────────────

/**
 * Subscribe to adminLogs with optional filters.
 * Calls callback with { logs: [...], error }.
 * Returns unsubscribe function.
 *
 * @param {Function} callback
 * @param {{ moduleFilter?: string, statusFilter?: string, pageSize?: number }} opts
 */
export function subscribeToActivityLogs(
  callback,
  { moduleFilter = 'all', statusFilter = 'all', pageSize = 50, lastDoc = null } = {},
) {
  let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(pageSize));

  if (moduleFilter !== 'all') {
    q = query(
      collection(db, COLLECTION),
      where('module', '==', moduleFilter),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    );
  }

  if (lastDoc) q = query(q, startAfter(lastDoc));

  return onSnapshot(
    q,
    (snap) => callback({ logs: snap.docs.map((d) => ({ id: d.id, _doc: d, ...d.data() })), error: null }),
    (err)  => callback({ logs: [], error: err }),
  );
}
