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
import { logActivity }  from './activityLogService.js';

const COLLECTION = 'owners';

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
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // already deleted or external URL — ignore
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

/**
 * Create a new owner.
 * photoFile – optional File for profile photo
 * docFiles  – optional File[] for documents
 */
export async function createOwner(data, photoFile = null, docFiles = []) {
  let photoURL = data.photo ?? '';

  if (photoFile) {
    const ext = photoFile.name.split('.').pop();
    photoURL = await uploadFile(
      photoFile,
      `owners/photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
    );
  }

  const uploadedDocs = await Promise.all(
    docFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `owners/documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
      );
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );

  const payload = {
    ...data,
    photo: photoURL,
    documents: [...(data.documents ?? []), ...uploadedDocs],
    status: data.status ?? 'Active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  await logActivity({ action: 'Owner created', label: data.fullName, module: 'Owners', status: 'Approved' });
  return docRef.id;
}

/**
 * Update an existing owner.
 * newPhotoFile – optional File to replace profile photo
 * newDocFiles  – optional File[] to append documents
 */
export async function updateOwner(id, data, newPhotoFile = null, newDocFiles = []) {
  let photoURL = data.photo ?? '';

  if (newPhotoFile) {
    const ext = newPhotoFile.name.split('.').pop();
    photoURL = await uploadFile(
      newPhotoFile,
      `owners/photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
    );
  }

  const uploadedDocs = await Promise.all(
    newDocFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `owners/documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
      );
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );

  const payload = {
    ...data,
    photo: photoURL,
    documents: [...(data.documents ?? []), ...uploadedDocs],
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, COLLECTION, id), payload);
  await logActivity({ action: 'Owner updated', label: data.fullName, module: 'Owners', status: 'Approved' });
}

/** Delete owner and clean up Storage files. */
export async function deleteOwner(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  const name = snap.exists() ? snap.data().fullName : id;
  if (snap.exists()) {
    const d = snap.data();
    if (d.photo) await safeDeleteFile(d.photo);
    for (const item of d.documents ?? []) {
      if (item.url) await safeDeleteFile(item.url);
    }
  }
  await deleteDoc(doc(db, COLLECTION, id));
  await logActivity({ action: 'Owner deleted', label: name, module: 'Owners', status: 'Rejected' });
}

/** Fetch a single owner by ID (one-time). */
export async function getOwnerById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Real-time subscription to the owners collection.
 * Returns unsubscribe function.
 */
export function subscribeToOwners(callback, { statusFilter = 'all' } = {}) {
  let q;
  if (statusFilter && statusFilter !== 'all') {
    q = query(
      collection(db, COLLECTION),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc'),
    );
  } else {
    q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const owners = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback({ owners, error: null });
    },
    (error) => callback({ owners: [], error }),
  );
}
