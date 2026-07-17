import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/firebase.js';

const COLLECTION = 'properties';

// ── Storage helpers ────────────────────────────────────────────────────────────

export async function uploadFile(file, path) {
  const storageRef = ref(storage, path);
  const snap = await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, reject, () => resolve(task.snapshot));
  });
  return getDownloadURL(snap.ref);
}

async function safeDeleteFile(url) {
  if (!url || url.startsWith('http') === false) return;
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // already deleted or external URL — ignore
  }
}

// ── Activity log helper ────────────────────────────────────────────────────────

async function logActivity(action, propertyTitle = '') {
  try {
    const now = new Date();
    await addDoc(collection(db, 'adminLogs'), {
      activity: action + (propertyTitle ? `: ${propertyTitle}` : ''),
      user: 'Admin',
      module: 'Properties',
      status: action.startsWith('Deleted') ? 'Rejected' : 'Approved',
      timestamp: serverTimestamp(),
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch {
    // log failure is non-fatal
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

/**
 * Create a new property.
 * imageFiles – File[] for property images
 * docFiles   – File[] for documents
 */
export async function createProperty(data, imageFiles = [], docFiles = []) {
  const uploadedImages = await Promise.all(
    imageFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `properties/images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
      );
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );

  const uploadedDocs = await Promise.all(
    docFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `properties/documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
      );
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );

  const payload = {
    ...data,
    images: [...(data.images ?? []), ...uploadedImages],
    documents: [...(data.documents ?? []), ...uploadedDocs],
    status: data.status ?? 'Available',
    amenities: data.amenities ?? [],
    ownerIds: data.ownerIds ?? [],
    tenantIds: data.tenantIds ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  await logActivity('Property created', data.title);
  return docRef.id;
}

/**
 * Update an existing property.
 * newImageFiles – File[] to append images
 * newDocFiles   – File[] to append documents
 */
export async function updateProperty(id, data, newImageFiles = [], newDocFiles = []) {
  const uploadedImages = await Promise.all(
    newImageFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `properties/images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
      );
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );

  const uploadedDocs = await Promise.all(
    newDocFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `properties/documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
      );
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );

  const payload = {
    ...data,
    images: [...(data.images ?? []), ...uploadedImages],
    documents: [...(data.documents ?? []), ...uploadedDocs],
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, COLLECTION, id), payload);
  await logActivity('Property updated', data.title);
}

/** Delete property and clean up all Storage files. */
export async function deleteProperty(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (snap.exists()) {
    const d = snap.data();
    for (const img of d.images ?? []) {
      if (img.url) await safeDeleteFile(img.url);
    }
    for (const item of d.documents ?? []) {
      if (item.url) await safeDeleteFile(item.url);
    }
    await logActivity('Property deleted', d.title);
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Fetch a single property by ID (one-time). */
export async function getPropertyById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Real-time subscription to the properties collection.
 * callback receives { properties, error }
 */
export function subscribeToProperties(callback, { statusFilter = 'all', typeFilter = 'all' } = {}) {
  let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

  if (statusFilter !== 'all') {
    q = query(collection(db, COLLECTION), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      let properties = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (typeFilter !== 'all') {
        properties = properties.filter((p) => p.type === typeFilter);
      }
      callback({ properties, error: null });
    },
    (error) => callback({ properties: [], error }),
  );
}
