import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/firebase.js';

const COLLECTION = 'users';

// ── Storage helpers ────────────────────────────────────────────────────────────

export async function uploadFile(file, storagePath) {
  const storageRef = ref(storage, storagePath);
  const snap = await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, reject, () => resolve(task.snapshot));
  });
  return getDownloadURL(snap.ref);
}

async function safeDelete(url) {
  if (!url) return;
  try { await deleteObject(ref(storage, url)); } catch { /* already gone */ }
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export async function createUser(data, photoFile = null, docFiles = []) {
  let photo = data.photo ?? '';
  if (photoFile) {
    const ext = photoFile.name.split('.').pop();
    photo = await uploadFile(photoFile, `users/photos/${uid()}.${ext}`);
  }

  const uploadedDocs = await Promise.all(
    docFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(f, `users/documents/${uid()}.${ext}`);
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );

  const payload = {
    ...data,
    photo,
    documents: [...(data.documents ?? []), ...uploadedDocs],
    status:    data.status ?? 'Active',
    role:      data.role   ?? 'Viewer',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref2 = await addDoc(collection(db, COLLECTION), payload);
  return ref2.id;
}

export async function updateUser(id, data, photoFile = null, docFiles = []) {
  let photo = data.photo ?? '';
  if (photoFile) {
    const ext = photoFile.name.split('.').pop();
    photo = await uploadFile(photoFile, `users/photos/${uid()}.${ext}`);
  }

  const uploadedDocs = await Promise.all(
    docFiles.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(f, `users/documents/${uid()}.${ext}`);
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );

  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    photo,
    documents: [...(data.documents ?? []), ...uploadedDocs],
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUser(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (snap.exists()) {
    const d = snap.data();
    if (d.photo) await safeDelete(d.photo);
    for (const item of d.documents ?? []) await safeDelete(item.url);
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function getUserById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Real-time subscription. Fetches all users ordered by createdAt desc.
 * Status / role filtering done client-side → no composite index needed.
 */
export function subscribeToUsers(callback) {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback({ users: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
    (error) => callback({ users: [], error }),
  );
}
