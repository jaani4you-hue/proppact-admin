/**
 * Complaint History — per-complaint audit trail stored as a Firestore
 * sub-collection:  complaints/{complaintId}/history
 *
 * Each entry shape:
 *   action      string   – human-readable label, e.g. "Status changed"
 *   note        string   – optional free-text detail
 *   fromStatus  string   – previous status (may be empty on create)
 *   toStatus    string   – new / current status
 *   changedBy   string   – always "Admin" for now (extend when auth roles added)
 *   timestamp   Timestamp
 *   date        string   – formatted for display
 *   time        string   – formatted for display
 */

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const CMP_COL = 'complaints';
const HIST_COL = 'history';

// ── Write a history entry ─────────────────────────────────────────────────────

export async function addComplaintHistory(complaintId, {
  action,
  note       = '',
  fromStatus = '',
  toStatus   = '',
  changedBy  = 'Admin',
} = {}) {
  if (!complaintId) return;
  try {
    const now = new Date();
    await addDoc(collection(db, CMP_COL, complaintId, HIST_COL), {
      action,
      note,
      fromStatus,
      toStatus,
      changedBy,
      timestamp: serverTimestamp(),
      date : now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time : now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch { /* non-fatal — history is supplementary */ }
}

// ── Real-time subscription ────────────────────────────────────────────────────

export function subscribeToComplaintHistory(complaintId, callback) {
  if (!complaintId) {
    callback({ history: [], error: null });
    return () => {};
  }
  const q = query(
    collection(db, CMP_COL, complaintId, HIST_COL),
    orderBy('timestamp', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => callback({
      history: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      error: null,
    }),
    (error) => callback({ history: [], error }),
  );
}
