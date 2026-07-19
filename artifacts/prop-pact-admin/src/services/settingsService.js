import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/firebase.js';

const SETTINGS_DOC = doc(db, 'settings', 'company');

// ── Default settings ──────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  // Company Profile
  companyName   : 'PropPact Realty',
  companyAddress: '',
  phone         : '',
  email         : '',
  website       : '',
  logoUrl       : '',
  logoPath      : '',
  // General
  timezone      : 'Asia/Kolkata',
  currency      : 'INR',
  dateFormat    : 'DD/MM/YYYY',
  language      : 'en-IN',
  // Branding
  primaryColor  : '#f97316',
  // GST / Tax
  gstin         : '',
  taxRate       : 18,
  invoicePrefix : 'INV',
  // Meta
  updatedAt     : null,
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getSettings() {
  const snap = await getDoc(SETTINGS_DOC);
  if (!snap.exists()) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...snap.data() };
}

export async function updateSettings(data) {
  await setDoc(SETTINGS_DOC, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ── Logo upload ───────────────────────────────────────────────────────────────

export async function uploadLogo(file) {
  const ext      = file.name.split('.').pop();
  const path     = `branding/logo_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, reject, () => resolve(task.snapshot));
  });

  const url = await getDownloadURL(ref(storage, path));
  return { url, path };
}

export async function deleteLogo(storagePath) {
  if (!storagePath) return;
  try { await deleteObject(ref(storage, storagePath)); } catch { /* already gone */ }
}

// ── Real-time subscription ────────────────────────────────────────────────────

export function subscribeToSettings(callback) {
  return onSnapshot(
    SETTINGS_DOC,
    (snap) => {
      const data = snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : { ...DEFAULT_SETTINGS };
      callback({ settings: data, error: null });
    },
    (error) => callback({ settings: { ...DEFAULT_SETTINGS }, error }),
  );
}

// ── Backup export ─────────────────────────────────────────────────────────────

const BACKUP_COLLECTIONS = [
  'properties', 'projects', 'owners', 'tenants', 'dealers',
  'vendors', 'users', 'maintenanceRequests', 'complaints',
  'legal', 'rent', 'notifications', 'settings',
];

export async function exportBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    version   : '1.0',
    collections: {},
  };

  await Promise.all(
    BACKUP_COLLECTIONS.map(async (col) => {
      try {
        const snap = await getDocs(query(collection(db, col), orderBy('createdAt', 'desc')));
        backup.collections[col] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          // Convert Firestore timestamps to ISO strings
          ...(d.data().createdAt?.toDate && { createdAt: d.data().createdAt.toDate().toISOString() }),
          ...(d.data().updatedAt?.toDate && { updatedAt: d.data().updatedAt.toDate().toISOString() }),
        }));
      } catch {
        backup.collections[col] = [];
      }
    }),
  );

  return backup;
}
