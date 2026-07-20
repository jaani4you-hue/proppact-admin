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
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/firebase.js';
import { logActivity }  from './activityLogService.js';

const COLLECTION = 'tenants';

// ── Storage ────────────────────────────────────────────────────────────────────

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

// ── Document upload helpers ────────────────────────────────────────────────────

/**
 * Upload named document slots (aadhaar_doc, pan_doc, rent_agreement,
 * police_verification) and merge with existing docs array.
 */
async function uploadNamedDocs(specificFiles, existingDocs) {
  const NAMED = {
    aadhaar_doc:          'Aadhaar Card',
    pan_doc:              'PAN Card',
    rent_agreement:       'Rent Agreement',
    police_verification:  'Police Verification',
  };

  // Start with existing named docs (preserve already-uploaded entries)
  const result = existingDocs.filter((d) => d.type === 'other');
  const named  = Object.fromEntries(
    existingDocs.filter((d) => d.type !== 'other').map((d) => [d.type, d]),
  );

  for (const [type, file] of Object.entries(specificFiles)) {
    if (!file) {
      if (named[type]) result.push(named[type]);
      continue;
    }
    const ext = file.name.split('.').pop();
    const url = await uploadFile(file, `tenants/documents/${type}_${uid()}.${ext}`);
    result.push({ type, name: NAMED[type] ?? type, url, uploadedAt: new Date().toISOString() });
  }

  return result;
}

async function uploadOtherDocs(files) {
  return Promise.all(
    files.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(f, `tenants/documents/other_${uid()}.${ext}`);
      return { type: 'other', name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export async function createTenant(data, photoFile, specificDocFiles, otherDocFiles) {
  let photo = data.photo ?? '';
  if (photoFile) {
    const ext = photoFile.name.split('.').pop();
    photo = await uploadFile(photoFile, `tenants/photos/${uid()}.${ext}`);
  }

  const namedDocs = await uploadNamedDocs(specificDocFiles, []);
  const otherDocs = await uploadOtherDocs(otherDocFiles);

  const payload = {
    ...data,
    photo,
    documents: [...namedDocs, ...otherDocs],
    status:    data.status ?? 'Active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref2 = await addDoc(collection(db, COLLECTION), payload);
  await logActivity({ action: 'Tenant created', label: data.fullName, module: 'Tenants', status: 'Approved' });
  return ref2.id;
}

export async function updateTenant(id, data, photoFile, specificDocFiles, otherDocFiles) {
  let photo = data.photo ?? '';
  if (photoFile) {
    const ext = photoFile.name.split('.').pop();
    photo = await uploadFile(photoFile, `tenants/photos/${uid()}.${ext}`);
  }

  // existing named docs come from data.documents
  const namedDocs = await uploadNamedDocs(specificDocFiles, data.documents ?? []);
  const otherDocs = await uploadOtherDocs(otherDocFiles);

  const payload = {
    ...data,
    photo,
    documents: [...namedDocs, ...otherDocs],
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, COLLECTION, id), payload);
  await logActivity({ action: 'Tenant updated', label: data.fullName, module: 'Tenants', status: 'Approved' });
}

export async function deleteTenant(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  const name = snap.exists() ? snap.data().fullName : id;
  if (snap.exists()) {
    const d = snap.data();
    if (d.photo) await safeDelete(d.photo);
    for (const item of d.documents ?? []) await safeDelete(item.url);
  }
  await deleteDoc(doc(db, COLLECTION, id));
  await logActivity({ action: 'Tenant deleted', label: name, module: 'Tenants', status: 'Rejected' });
}

export async function getTenantById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Real-time subscription – fetches all tenants ordered by createdAt.
 * Status filtering is done client-side (avoids composite-index requirement).
 */
export function subscribeToTenants(callback) {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback({ tenants: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
    (error) => callback({ tenants: [], error }),
  );
}

/** One-time fetch of properties collection for dropdown. */
export function subscribeToProperties(callback) {
  const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => callback([]),
  );
}
