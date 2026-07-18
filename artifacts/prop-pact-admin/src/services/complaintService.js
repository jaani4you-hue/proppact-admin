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
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/firebase.js';

const CMP_COL = 'complaints';

// ── Number generator ──────────────────────────────────────────────────────────

export function generateComplaintNumber() {
  const now  = new Date();
  const yy   = now.getFullYear().toString().slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CMP-${yy}${mm}-${rand}`;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export async function uploadFile(file, folder = 'complaints/attachments') {
  const ext      = file.name.split('.').pop();
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);
  const snap = await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, reject, () => resolve(task.snapshot));
  });
  return {
    url        : await getDownloadURL(snap.ref),
    storagePath: `${folder}/${safeName}`,
    name       : file.name,
    size       : file.size,
    type       : file.type,
    uploadedAt : new Date().toISOString(),
  };
}

async function safeDeleteFile(storagePath) {
  if (!storagePath) return;
  try { await deleteObject(ref(storage, storagePath)); } catch { /* already gone */ }
}

// ── Activity log ──────────────────────────────────────────────────────────────

async function logActivity(action, label = '') {
  try {
    const now = new Date();
    await addDoc(collection(db, 'adminLogs'), {
      activity : action + (label ? `: ${label}` : ''),
      user     : 'Admin',
      module   : 'Complaints',
      status   : action.startsWith('Deleted') ? 'Rejected' : 'Approved',
      timestamp: serverTimestamp(),
      date     : now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time     : now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch { /* non-fatal */ }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createComplaint(data, attachmentFiles = []) {
  const uploaded = await Promise.all(
    attachmentFiles.map((f) => uploadFile(f, 'complaints/attachments')),
  );

  const payload = {
    ...data,
    complaintNumber: data.complaintNumber || generateComplaintNumber(),
    status         : data.status || 'Open',
    attachments    : [...(data.attachments ?? []), ...uploaded],
    createdAt      : serverTimestamp(),
    updatedAt      : serverTimestamp(),
  };

  const ref2 = await addDoc(collection(db, CMP_COL), payload);
  await logActivity('Complaint created', data.title);
  return ref2.id;
}

export async function updateComplaint(id, data, newAttachmentFiles = []) {
  const uploaded = await Promise.all(
    newAttachmentFiles.map((f) => uploadFile(f, 'complaints/attachments')),
  );

  const payload = {
    ...data,
    attachments: [...(data.attachments ?? []), ...uploaded],
    updatedAt  : serverTimestamp(),
  };

  // If resolving, set resolvedAt timestamp
  if (data.status === 'Resolved' && !data.resolvedAt) {
    payload.resolvedAt = new Date().toISOString();
  }

  await updateDoc(doc(db, CMP_COL, id), payload);
  await logActivity('Complaint updated', data.title);
}

export async function deleteComplaint(id) {
  const snap = await getDoc(doc(db, CMP_COL, id));
  if (snap.exists()) {
    const d = snap.data();
    for (const f of (d.attachments ?? [])) {
      if (f.storagePath) await safeDeleteFile(f.storagePath);
    }
    await logActivity('Complaint deleted', d.title || d.complaintNumber);
  }
  await deleteDoc(doc(db, CMP_COL, id));
}

export async function getComplaintById(id) {
  const snap = await getDoc(doc(db, CMP_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Link maintenance request to a complaint ───────────────────────────────────

export async function linkMaintenanceToComplaint(complaintId, maintenanceId, maintenanceNumber) {
  await updateDoc(doc(db, CMP_COL, complaintId), {
    maintenanceId    : maintenanceId,
    maintenanceNumber: maintenanceNumber,
    status           : 'In Progress',
    updatedAt        : serverTimestamp(),
  });
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToComplaints(
  callback,
  { statusFilter = 'all', priorityFilter = 'all', categoryFilter = 'all' } = {},
) {
  let q = query(collection(db, CMP_COL), orderBy('createdAt', 'desc'));

  if (statusFilter !== 'all') {
    q = query(
      collection(db, CMP_COL),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc'),
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      let complaints = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (priorityFilter !== 'all') {
        complaints = complaints.filter((c) => c.priority === priorityFilter);
      }
      if (categoryFilter !== 'all') {
        complaints = complaints.filter((c) => c.category === categoryFilter);
      }
      callback({ complaints, error: null });
    },
    (error) => callback({ complaints: [], error }),
  );
}

export function subscribeToComplaintById(id, callback) {
  return onSnapshot(
    doc(db, CMP_COL, id),
    (snap) => {
      if (snap.exists()) callback({ complaint: { id: snap.id, ...snap.data() }, error: null });
      else               callback({ complaint: null, error: null });
    },
    (error) => callback({ complaint: null, error }),
  );
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

export async function fetchAllComplaints() {
  const snap = await getDocs(query(collection(db, CMP_COL), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
