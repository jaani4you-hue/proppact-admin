import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const VENDORS_COL = 'vendors';

// ── Vendor number generator ───────────────────────────────────────────────────

export function generateVendorCode() {
  const now  = new Date();
  const yy   = now.getFullYear().toString().slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `VND-${yy}${mm}-${rand}`;
}

// ── Activity log ──────────────────────────────────────────────────────────────

async function logActivity(action, label = '') {
  try {
    const now = new Date();
    await addDoc(collection(db, 'adminLogs'), {
      activity : action + (label ? `: ${label}` : ''),
      user     : 'Admin',
      module   : 'Vendors',
      status   : action.startsWith('Deleted') ? 'Rejected' : 'Approved',
      timestamp: serverTimestamp(),
      date     : now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time     : now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch { /* non-fatal */ }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createVendor(data) {
  const payload = {
    ...data,
    vendorCode   : data.vendorCode || generateVendorCode(),
    status       : data.status     || 'Active',
    rating       : Number(data.rating) || 0,
    createdAt    : serverTimestamp(),
    updatedAt    : serverTimestamp(),
  };
  const ref = await addDoc(collection(db, VENDORS_COL), payload);
  await logActivity('Vendor created', data.name);
  return ref.id;
}

export async function updateVendor(id, data) {
  const payload = {
    ...data,
    rating   : Number(data.rating) || 0,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, VENDORS_COL, id), payload);
  await logActivity('Vendor updated', data.name);
}

export async function deleteVendor(id) {
  const snap = await getDoc(doc(db, VENDORS_COL, id));
  if (snap.exists()) {
    await logActivity('Vendor deleted', snap.data().name);
  }
  await deleteDoc(doc(db, VENDORS_COL, id));
}

export async function getVendorById(id) {
  const snap = await getDoc(doc(db, VENDORS_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToVendors(callback, { statusFilter = 'all', categoryFilter = 'all' } = {}) {
  let q = query(collection(db, VENDORS_COL), orderBy('createdAt', 'desc'));

  if (statusFilter !== 'all') {
    q = query(
      collection(db, VENDORS_COL),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc'),
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      let vendors = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (categoryFilter !== 'all') {
        vendors = vendors.filter((v) => v.category === categoryFilter);
      }
      callback({ vendors, error: null });
    },
    (error) => callback({ vendors: [], error }),
  );
}

export function subscribeToVendorById(id, callback) {
  return onSnapshot(
    doc(db, VENDORS_COL, id),
    (snap) => {
      if (snap.exists()) callback({ vendor: { id: snap.id, ...snap.data() }, error: null });
      else               callback({ vendor: null, error: null });
    },
    (error) => callback({ vendor: null, error }),
  );
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

export async function fetchAllVendors() {
  const snap = await getDocs(query(collection(db, VENDORS_COL), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
