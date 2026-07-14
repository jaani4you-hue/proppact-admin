/**
 * useActivityLog
 *
 * Real-time listener on the `adminLogs` collection.
 * Returns the latest 10 documents sorted by createdAt descending.
 *
 * Field name mapping (tries multiple common names so it works regardless
 * of the exact schema chosen in Firestore):
 *   activity → activity | action | description | message
 *   user     → user | userName | performedBy | adminName
 *   module   → module | type | category | section
 *   status   → status (defaults to "Pending" if absent)
 *   date/time→ derived from createdAt (Firestore Timestamp or ISO string)
 */

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

function parseTimestamp(createdAt) {
  if (!createdAt) return { date: '--', time: '--' };
  let d;
  if (typeof createdAt?.toDate === 'function') {
    d = createdAt.toDate();
  } else if (createdAt instanceof Date) {
    d = createdAt;
  } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    d = new Date(createdAt);
  } else {
    return { date: '--', time: '--' };
  }
  if (isNaN(d.getTime())) return { date: '--', time: '--' };
  return {
    date: d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function mapDoc(doc) {
  const d = doc.data();
  const { date, time } = parseTimestamp(d.createdAt ?? d.timestamp ?? d.date);
  return {
    id:       doc.id,
    activity: d.activity ?? d.action ?? d.description ?? d.message ?? 'Activity logged',
    user:     d.user     ?? d.userName ?? d.performedBy ?? d.adminName ?? 'System',
    module:   d.module   ?? d.type     ?? d.category    ?? d.section   ?? '—',
    status:   d.status   ?? 'Pending',
    date,
    time,
  };
}

export function useActivityLog() {
  // null = loading, [] = loaded but empty, [...] = has rows
  const [activities, setActivities] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'adminLogs'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      (snap) => setActivities(snap.docs.map(mapDoc)),
      (err) => {
        console.warn('[useActivityLog] adminLogs:', err.code, err.message);
        setActivities([]); // on error show empty state, not a crash
      }
    );

    return () => unsub();
  }, []);

  return activities; // null | Row[]
}
