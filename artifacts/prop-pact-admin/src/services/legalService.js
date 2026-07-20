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
import { notifyOnce } from './notificationService.js';

const CASES_COL    = 'legalCases';
const HEARINGS_COL = 'legalHearings';

// ── Case number generator ─────────────────────────────────────────────────────

export function generateCaseNumber() {
  const now  = new Date();
  const yy   = now.getFullYear().toString().slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `LC-${yy}${mm}-${rand}`;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export async function uploadFile(file, folder = 'legal/documents') {
  const ext      = file.name.split('.').pop();
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);
  const snap = await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, reject, () => resolve(task.snapshot));
  });
  return {
    url       : await getDownloadURL(snap.ref),
    storagePath: `${folder}/${safeName}`,
    name      : file.name,
    size      : file.size,
    type      : file.type,
    uploadedAt: new Date().toISOString(),
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
      module   : 'Legal',
      status   : action.startsWith('Deleted') ? 'Rejected' : 'Approved',
      timestamp: serverTimestamp(),
      date     : now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time     : now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch { /* non-fatal */ }
}

// ── CRUD: legalCases ──────────────────────────────────────────────────────────

export async function createLegalCase(data, docFiles = [], evidenceFiles = []) {
  const uploadedDocs = await Promise.all(
    docFiles.map((f) => uploadFile(f, 'legal/documents')),
  );
  const uploadedEvidence = await Promise.all(
    evidenceFiles.map((f) => uploadFile(f, 'legal/evidence')),
  );

  const payload = {
    ...data,
    caseNumber     : data.caseNumber || generateCaseNumber(),
    status         : data.status     || 'Pending',
    documents      : [...(data.documents  ?? []), ...uploadedDocs],
    evidence       : [...(data.evidence   ?? []), ...uploadedEvidence],
    claimAmount    : Number(data.claimAmount)    || 0,
    settledAmount  : Number(data.settledAmount)  || 0,
    legalFees      : Number(data.legalFees)      || 0,
    createdAt      : serverTimestamp(),
    updatedAt      : serverTimestamp(),
  };

  const ref2 = await addDoc(collection(db, CASES_COL), payload);
  await logActivity('Case created', data.title || data.caseNumber);
  await notifyOnce({
    type         : 'legal_reminder',
    title        : `New Legal Case — ${data.title || payload.caseNumber}`,
    body         : `Case type: ${data.caseType || 'General'} | Status: ${payload.status}.`,
    relatedId    : ref2.id,
    relatedModule: 'Legal',
    relatedPath  : `/admin/legal/${ref2.id}`,
    cooldownHours: 0,
  });
  return ref2.id;
}

export async function updateLegalCase(id, data, newDocFiles = [], newEvidenceFiles = []) {
  const uploadedDocs = await Promise.all(
    newDocFiles.map((f) => uploadFile(f, 'legal/documents')),
  );
  const uploadedEvidence = await Promise.all(
    newEvidenceFiles.map((f) => uploadFile(f, 'legal/evidence')),
  );

  const payload = {
    ...data,
    documents    : [...(data.documents ?? []), ...uploadedDocs],
    evidence     : [...(data.evidence  ?? []), ...uploadedEvidence],
    claimAmount  : Number(data.claimAmount)   || 0,
    settledAmount: Number(data.settledAmount) || 0,
    legalFees    : Number(data.legalFees)     || 0,
    updatedAt    : serverTimestamp(),
  };

  await updateDoc(doc(db, CASES_COL, id), payload);
  await logActivity('Case updated', data.title);
}

export async function deleteLegalCase(id) {
  const snap = await getDoc(doc(db, CASES_COL, id));
  if (snap.exists()) {
    const d = snap.data();
    for (const f of [...(d.documents ?? []), ...(d.evidence ?? [])]) {
      if (f.storagePath) await safeDeleteFile(f.storagePath);
    }
    await logActivity('Case deleted', d.title || d.caseNumber);
  }
  await deleteDoc(doc(db, CASES_COL, id));
}

export async function getLegalCaseById(id) {
  const snap = await getDoc(doc(db, CASES_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToLegalCases(
  callback,
  { statusFilter = 'all', typeFilter = 'all' } = {},
) {
  let q = query(collection(db, CASES_COL), orderBy('createdAt', 'desc'));

  if (statusFilter !== 'all') {
    q = query(
      collection(db, CASES_COL),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc'),
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      let cases = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (typeFilter !== 'all') {
        cases = cases.filter((c) => c.caseType === typeFilter);
      }
      callback({ cases, error: null });
    },
    (error) => callback({ cases: [], error }),
  );
}

export function subscribeToLegalCaseById(id, callback) {
  return onSnapshot(
    doc(db, CASES_COL, id),
    (snap) => {
      if (snap.exists()) callback({ legalCase: { id: snap.id, ...snap.data() }, error: null });
      else               callback({ legalCase: null, error: null });
    },
    (error) => callback({ legalCase: null, error }),
  );
}

// ── Hearings ──────────────────────────────────────────────────────────────────

export async function addHearing(caseId, data) {
  const caseSnap = await getDoc(doc(db, CASES_COL, caseId));
  const caseTitle = caseSnap.exists() ? (caseSnap.data().title || caseSnap.data().caseNumber) : '';

  const ref2 = await addDoc(collection(db, HEARINGS_COL), {
    ...data,
    caseId,
    caseTitle,
    createdAt: serverTimestamp(),
  });

  // Update case nextHearingDate if provided
  if (data.nextHearingDate) {
    await updateDoc(doc(db, CASES_COL, caseId), {
      nextHearingDate: data.nextHearingDate,
      updatedAt      : serverTimestamp(),
    });
  }

  await logActivity('Hearing added', caseTitle);
  return ref2.id;
}

export async function updateHearing(hearingId, data) {
  await updateDoc(doc(db, HEARINGS_COL, hearingId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteHearing(hearingId) {
  await deleteDoc(doc(db, HEARINGS_COL, hearingId));
}

export function subscribeToHearings(caseId, callback) {
  const q = query(
    collection(db, HEARINGS_COL),
    where('caseId', '==', caseId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => callback({ hearings: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
    (error) => callback({ hearings: [], error }),
  );
}

// ── Aggregate (for dashboard stats) ──────────────────────────────────────────

export async function fetchAllLegalCases() {
  const snap = await getDocs(query(collection(db, CASES_COL), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchUpcomingHearings(days = 7) {
  const snap = await getDocs(
    query(collection(db, HEARINGS_COL), orderBy('date', 'asc')),
  );
  const today  = new Date();
  const cutoff = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((h) => {
      if (!h.date) return false;
      const d = new Date(h.date);
      return d >= today && d <= cutoff;
    });
}
