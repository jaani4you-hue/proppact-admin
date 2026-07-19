import {
  collection,
  doc,
  addDoc,
  updateDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const NOTIF_COL = 'notifications';

// ── Types ─────────────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  RENT_REMINDER          : 'rent_reminder',
  COMPLAINT_UPDATE       : 'complaint_update',
  MAINTENANCE_UPDATE     : 'maintenance_update',
  LEGAL_REMINDER         : 'legal_reminder',
  SUBSCRIPTION_REMINDER  : 'subscription_reminder',
  VENDOR_STATUS          : 'vendor_status',
  GENERAL                : 'general',
};

export const TYPE_META = {
  rent_reminder         : { label: 'Rent Reminder',         color: 'orange', icon: 'KeyRound'         },
  complaint_update      : { label: 'Complaint Update',      color: 'red',    icon: 'MessageSquareWarning' },
  maintenance_update    : { label: 'Maintenance Update',    color: 'blue',   icon: 'Wrench'           },
  legal_reminder        : { label: 'Legal Reminder',        color: 'purple', icon: 'Scale'            },
  subscription_reminder : { label: 'Subscription Reminder', color: 'green',  icon: 'CreditCard'       },
  vendor_status         : { label: 'Vendor Update',         color: 'amber',  icon: 'HardHat'          },
  general               : { label: 'General',               color: 'gray',   icon: 'Bell'             },
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createNotification({ type, title, body, relatedId = '', relatedModule = '', relatedPath = '' }) {
  return addDoc(collection(db, NOTIF_COL), {
    type,
    title,
    body,
    relatedId,
    relatedModule,
    relatedPath,
    read     : false,
    createdAt: serverTimestamp(),
  });
}

export async function markAsRead(id) {
  await updateDoc(doc(db, NOTIF_COL, id), { read: true });
}

export async function markAllAsRead() {
  const snap = await getDocs(
    query(collection(db, NOTIF_COL), where('read', '==', false)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function deleteNotification(id) {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, NOTIF_COL, id));
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToNotifications(callback, { typeFilter = 'all', readFilter = 'all', maxItems = 100 } = {}) {
  let q = query(collection(db, NOTIF_COL), orderBy('createdAt', 'desc'), limit(maxItems));

  if (readFilter === 'unread') {
    q = query(collection(db, NOTIF_COL), where('read', '==', false), orderBy('createdAt', 'desc'), limit(maxItems));
  } else if (readFilter === 'read') {
    q = query(collection(db, NOTIF_COL), where('read', '==', true), orderBy('createdAt', 'desc'), limit(maxItems));
  }

  return onSnapshot(
    q,
    (snap) => {
      let notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (typeFilter !== 'all') {
        notifications = notifications.filter((n) => n.type === typeFilter);
      }
      callback({ notifications, error: null });
    },
    (error) => callback({ notifications: [], error }),
  );
}

export function subscribeToUnreadCount(callback) {
  return onSnapshot(
    query(collection(db, NOTIF_COL), where('read', '==', false)),
    (snap) => callback(snap.size),
    () => callback(0),
  );
}

// ── Seed helpers (call from admin to create test notifications) ───────────────

export async function seedSampleNotifications() {
  const samples = [
    {
      type: 'rent_reminder',
      title: 'Rent Due — Unit 4B',
      body: 'Rent of ₹18,000 for tenant Rahul Sharma is due on 1st Aug 2025.',
      relatedModule: 'Rent',
      relatedPath: '/admin/rent',
    },
    {
      type: 'complaint_update',
      title: 'Complaint Resolved — Water Leakage',
      body: 'Complaint #C-2501-1023 has been marked as Resolved.',
      relatedModule: 'Complaints',
      relatedPath: '/admin/complaints',
    },
    {
      type: 'maintenance_update',
      title: 'Work Order Completed — MNT-2501-4521',
      body: 'Ramesh Plumbing Works completed the plumbing repair at Block A.',
      relatedModule: 'Maintenance',
      relatedPath: '/admin/maintenance',
    },
    {
      type: 'legal_reminder',
      title: 'Lease Expiry — 15 days remaining',
      body: 'Lease agreement for Property #P-2312 expires on 3rd Aug 2025.',
      relatedModule: 'Legal',
      relatedPath: '/admin/legal',
    },
    {
      type: 'vendor_status',
      title: 'New Vendor Registration',
      body: 'Suresh Electrical Works has registered and is awaiting approval.',
      relatedModule: 'Vendors',
      relatedPath: '/admin/vendors',
    },
  ];
  for (const n of samples) {
    await createNotification(n);
  }
}
