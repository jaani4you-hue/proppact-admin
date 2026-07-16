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

const COLLECTION = 'dealers';

// ── Storage helpers ────────────────────────────────────────────────────────────

export async function uploadFile(file, path) {
  const storageRef = ref(storage, path);
  const snap = await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, reject, () => resolve(task.snapshot));
  });
  return getDownloadURL(snap.ref);
}

export async function deleteStorageFile(url) {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Ignore — file may already be deleted or URL may be external
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

/**
 * Create a new dealer.
 * photoFile  – optional File for profile photo
 * docFiles   – optional File[] for document uploads
 */
export async function createDealer(data, photoFile = null, docFiles = []) {
  let photoURL = data.photo ?? '';

  if (photoFile) {
    const ext = photoFile.name.split('.').pop();
    photoURL = await uploadFile(
      photoFile,
      `dealers/photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
    );
  }

  const uploadedDocs = await Promise.all(
    docFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `dealers/documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
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
  return docRef.id;
}

/**
 * Update an existing dealer.
 * newPhotoFile – optional File to replace the existing photo
 * newDocFiles  – optional File[] to append new documents
 */
export async function updateDealer(
  id,
  data,
  newPhotoFile = null,
  newDocFiles = [],
) {
  let photoURL = data.photo ?? '';

  if (newPhotoFile) {
    const ext = newPhotoFile.name.split('.').pop();
    photoURL = await uploadFile(
      newPhotoFile,
      `dealers/photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
    );
  }

  const uploadedDocs = await Promise.all(
    newDocFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `dealers/documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
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
}

/** Delete dealer and attempt to clean up Storage files. */
export async function deleteDealer(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (snap.exists()) {
    const d = snap.data();
    if (d.photo) await deleteStorageFile(d.photo);
    for (const docItem of d.documents ?? []) {
      if (docItem.url) await deleteStorageFile(docItem.url);
    }
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Fetch a single dealer by ID (one-time). */
export async function getDealerById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Real-time subscription to the dealers collection.
 * Optionally filters by status.
 * Returns unsubscribe function.
 */
export function subscribeToDealers(callback, { statusFilter = 'all' } = {}) {
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
      const dealers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback({ dealers, error: null });
    },
    (error) => {
      callback({ dealers: [], error });
    },
  );
}
