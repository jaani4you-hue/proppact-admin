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
  arrayUnion,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/firebase.js';

const COLLECTION = 'verifications';

// ── Storage helpers ─────────────────────────────────────────────────────────────

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
    await deleteObject(ref(storage, url));
  } catch {
    // Ignore — file may already be deleted or URL may be external
  }
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function uploadFileGroup(files, folder) {
  return Promise.all(
    files.map(async (f) => {
      const ext = f.name.split('.').pop();
      const url = await uploadFile(
        f,
        `verifications/${folder}/${uid()}.${ext}`,
      );
      return { name: f.name, url, uploadedAt: new Date().toISOString() };
    }),
  );
}

// ── Create ──────────────────────────────────────────────────────────────────────

/**
 * Create a new verification request.
 * @param {object} data - form data
 * @param {File[]} imageFiles - property images
 * @param {File[]} docFiles - supporting documents
 * @param {File|null} reportFile - verification report
 */
export async function createVerification(
  data,
  imageFiles = [],
  docFiles = [],
  reportFile = null,
) {
  const [images, documents] = await Promise.all([
    uploadFileGroup(imageFiles, 'images'),
    uploadFileGroup(docFiles, 'documents'),
  ]);

  let reportUrl = '';
  let reportName = '';
  if (reportFile) {
    const ext = reportFile.name.split('.').pop();
    reportUrl = await uploadFile(
      reportFile,
      `verifications/reports/${uid()}.${ext}`,
    );
    reportName = reportFile.name;
  }

  const now = new Date().toISOString();
  const initEntry = {
    id: uid(),
    action: 'Submitted',
    note: 'Verification request submitted.',
    performedBy: data.assignedOfficer || 'System',
    timestamp: now,
  };

  const payload = {
    propertyName: data.propertyName ?? '',
    propertyAddress: data.propertyAddress ?? '',
    propertyType: data.propertyType ?? 'Residential',
    ownerName: data.ownerName ?? '',
    ownerContact: data.ownerContact ?? '',
    ownerEmail: data.ownerEmail ?? '',
    status: data.status ?? 'Pending',
    assignedOfficer: data.assignedOfficer ?? '',
    notes: data.notes ?? '',
    remarks: data.remarks ?? '',
    images: [...(data.images ?? []), ...images],
    documents: [...(data.documents ?? []), ...documents],
    reportUrl,
    reportName,
    timeline: [initEntry],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
}

// ── Update ──────────────────────────────────────────────────────────────────────

export async function updateVerification(
  id,
  data,
  newImageFiles = [],
  newDocFiles = [],
  newReportFile = null,
) {
  const [newImages, newDocs] = await Promise.all([
    uploadFileGroup(newImageFiles, 'images'),
    uploadFileGroup(newDocFiles, 'documents'),
  ]);

  let reportUrl = data.reportUrl ?? '';
  let reportName = data.reportName ?? '';
  if (newReportFile) {
    const ext = newReportFile.name.split('.').pop();
    reportUrl = await uploadFile(
      newReportFile,
      `verifications/reports/${uid()}.${ext}`,
    );
    reportName = newReportFile.name;
  }

  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    images: [...(data.images ?? []), ...newImages],
    documents: [...(data.documents ?? []), ...newDocs],
    reportUrl,
    reportName,
    updatedAt: serverTimestamp(),
  });
}

// ── Status Updates ──────────────────────────────────────────────────────────────

/**
 * Change verification status and push a timeline entry.
 * @param {string} id
 * @param {'Pending'|'In Review'|'Approved'|'Rejected'} status
 * @param {string} note
 * @param {string} performedBy
 */
export async function updateVerificationStatus(
  id,
  status,
  note = '',
  performedBy = 'Admin',
) {
  const entry = {
    id: uid(),
    action: status,
    note,
    performedBy,
    timestamp: new Date().toISOString(),
  };
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    updatedAt: serverTimestamp(),
    timeline: arrayUnion(entry),
  });
}

// ── Officer Assignment ──────────────────────────────────────────────────────────

export async function assignOfficer(id, officerName, performedBy = 'Admin') {
  const entry = {
    id: uid(),
    action: 'Officer Assigned',
    note: `Assigned to ${officerName}`,
    performedBy,
    timestamp: new Date().toISOString(),
  };
  await updateDoc(doc(db, COLLECTION, id), {
    assignedOfficer: officerName,
    updatedAt: serverTimestamp(),
    timeline: arrayUnion(entry),
  });
}

// ── Notes ───────────────────────────────────────────────────────────────────────

export async function addVerificationNote(id, note, performedBy = 'Admin') {
  const entry = {
    id: uid(),
    action: 'Note Added',
    note,
    performedBy,
    timestamp: new Date().toISOString(),
  };
  await updateDoc(doc(db, COLLECTION, id), {
    updatedAt: serverTimestamp(),
    timeline: arrayUnion(entry),
  });
}

// ── File Uploads ────────────────────────────────────────────────────────────────

/**
 * Append images, documents, or a report to an existing verification.
 */
export async function appendVerificationFiles(
  id,
  imageFiles = [],
  docFiles = [],
  reportFile = null,
) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) throw new Error('Verification not found');
  const existing = snap.data();

  const [newImages, newDocs] = await Promise.all([
    uploadFileGroup(imageFiles, 'images'),
    uploadFileGroup(docFiles, 'documents'),
  ]);

  let reportUrl = existing.reportUrl ?? '';
  let reportName = existing.reportName ?? '';
  if (reportFile) {
    const ext = reportFile.name.split('.').pop();
    reportUrl = await uploadFile(
      reportFile,
      `verifications/reports/${uid()}.${ext}`,
    );
    reportName = reportFile.name;
  }

  const total = imageFiles.length + docFiles.length + (reportFile ? 1 : 0);
  const entry = {
    id: uid(),
    action: 'Files Uploaded',
    note: `Uploaded ${total} file${total !== 1 ? 's' : ''}`,
    performedBy: 'Admin',
    timestamp: new Date().toISOString(),
  };

  await updateDoc(doc(db, COLLECTION, id), {
    images: [...(existing.images ?? []), ...newImages],
    documents: [...(existing.documents ?? []), ...newDocs],
    reportUrl,
    reportName,
    updatedAt: serverTimestamp(),
    timeline: arrayUnion(entry),
  });
}

// ── Delete ──────────────────────────────────────────────────────────────────────

export async function deleteVerification(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (snap.exists()) {
    const d = snap.data();
    await Promise.all([
      ...(d.images ?? []).map((f) =>
        f.url ? deleteStorageFile(f.url) : Promise.resolve(),
      ),
      ...(d.documents ?? []).map((f) =>
        f.url ? deleteStorageFile(f.url) : Promise.resolve(),
      ),
      d.reportUrl ? deleteStorageFile(d.reportUrl) : Promise.resolve(),
    ]);
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

// ── Reads ───────────────────────────────────────────────────────────────────────

/** One-time fetch of a single verification. */
export async function getVerificationById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Real-time subscription to a single verification document.
 * Returns unsubscribe function.
 */
export function subscribeToVerification(id, callback) {
  return onSnapshot(
    doc(db, COLLECTION, id),
    (snap) => {
      if (!snap.exists()) {
        callback({ data: null, error: null });
        return;
      }
      callback({ data: { id: snap.id, ...snap.data() }, error: null });
    },
    (error) => callback({ data: null, error }),
  );
}

/**
 * Real-time subscription to the verifications collection.
 * Server-filters by status; client-side search is applied in the hook.
 * Returns unsubscribe function.
 */
export function subscribeToVerifications(callback, { statusFilter = 'all' } = {}) {
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
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback({ items, error: null });
    },
    (error) => callback({ items: [], error }),
  );
}

/**
 * Real-time count of pending verifications (used for sidebar badge).
 * Returns unsubscribe function.
 */
export function subscribeToPendingCount(callback) {
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'Pending'),
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.size),
    () => callback(0),
  );
}
