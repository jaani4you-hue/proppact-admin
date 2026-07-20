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
import { resolveComplaintFromMaintenance } from './complaintService.js';
import { addComplaintHistory } from './complaintHistoryService.js';

const MNT_COL = 'maintenanceRequests';

// ── Number generator ──────────────────────────────────────────────────────────

export function generateMaintenanceNumber() {
  const now  = new Date();
  const yy   = now.getFullYear().toString().slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `MNT-${yy}${mm}-${rand}`;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export async function uploadFile(file, folder = 'maintenance/attachments') {
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
      module   : 'Maintenance',
      status   : action.startsWith('Deleted') ? 'Rejected' : 'Approved',
      timestamp: serverTimestamp(),
      date     : now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time     : now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch { /* non-fatal */ }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createMaintenanceRequest(data, attachmentFiles = []) {
  const uploaded = await Promise.all(
    attachmentFiles.map((f) => uploadFile(f, 'maintenance/attachments')),
  );

  const payload = {
    ...data,
    maintenanceNumber: data.maintenanceNumber || generateMaintenanceNumber(),
    status           : data.status || 'Pending',
    estimatedCost    : Number(data.estimatedCost) || 0,
    actualCost       : Number(data.actualCost)    || 0,
    attachments      : [...(data.attachments ?? []), ...uploaded],
    createdAt        : serverTimestamp(),
    updatedAt        : serverTimestamp(),
  };

  const ref2 = await addDoc(collection(db, MNT_COL), payload);
  await logActivity('Request created', data.title);
  await notifyOnce({
    type         : 'maintenance_update',
    title        : `New Maintenance Request — ${data.title || payload.maintenanceNumber}`,
    body         : `Priority: ${data.priority || 'Normal'} | Category: ${data.category || 'General'}.`,
    relatedId    : ref2.id,
    relatedModule: 'Maintenance',
    relatedPath  : `/admin/maintenance/${ref2.id}`,
    cooldownHours: 0,
  });

  // Log history on the linked complaint
  if (data.complaintId) {
    await addComplaintHistory(data.complaintId, {
      action    : 'Work order created',
      note      : `${payload.maintenanceNumber} — ${data.title}`,
      fromStatus: 'In Progress',
      toStatus  : 'In Progress',
    });
  }

  return ref2.id;
}

export async function updateMaintenanceRequest(id, data, newAttachmentFiles = []) {
  const uploaded = await Promise.all(
    newAttachmentFiles.map((f) => uploadFile(f, 'maintenance/attachments')),
  );

  // Snapshot before update to detect status change
  const prevSnap = await getDoc(doc(db, MNT_COL, id));
  const prev = prevSnap.exists() ? prevSnap.data() : {};
  const prevStatus = prev.status || '';

  const payload = {
    ...data,
    estimatedCost: Number(data.estimatedCost) || 0,
    actualCost   : Number(data.actualCost)    || 0,
    attachments  : [...(data.attachments ?? []), ...uploaded],
    updatedAt    : serverTimestamp(),
  };

  // Set completedDate automatically
  if (data.status === 'Completed' && !data.completedDate) {
    payload.completedDate = new Date().toISOString().slice(0, 10);
  }

  await updateDoc(doc(db, MNT_COL, id), payload);
  await logActivity('Request updated', data.title);
  if (data.status && data.status !== prevStatus) {
    const mntNotifMap = {
      'Completed' : { title: `Work Completed — ${data.title || ''}`, body: `Maintenance request has been marked as Completed.` },
      'In Progress': { title: `Work In Progress — ${data.title || ''}`, body: `Maintenance work has started.` },
      'Cancelled'  : { title: `Work Cancelled — ${data.title || ''}`, body: `Maintenance request was cancelled.` },
    };
    const notifData = mntNotifMap[data.status];
    if (notifData) {
      await notifyOnce({
        type         : 'maintenance_update',
        title        : notifData.title,
        body         : notifData.body,
        relatedId    : `${id}_${data.status}`,
        relatedModule: 'Maintenance',
        relatedPath  : `/admin/maintenance/${id}`,
        cooldownHours: 1,
      });
    }
  }

  // If newly assigned vendor, log on complaint
  if (data.complaintId && data.assignedVendorName && !prev.assignedVendorName) {
    await addComplaintHistory(data.complaintId, {
      action    : 'Vendor assigned',
      note      : `${data.assignedVendorName} assigned to work order ${data.maintenanceNumber || prev.maintenanceNumber}`,
      fromStatus: 'In Progress',
      toStatus  : 'In Progress',
    });
  }

  // Auto-resolve linked complaint when work is Completed
  if (data.status === 'Completed' && prevStatus !== 'Completed') {
    const complaintId = data.complaintId || prev.complaintId;
    const mntNumber   = data.maintenanceNumber || prev.maintenanceNumber;
    if (complaintId) {
      await resolveComplaintFromMaintenance(complaintId, mntNumber);
    }
  }
}

export async function deleteMaintenanceRequest(id) {
  const snap = await getDoc(doc(db, MNT_COL, id));
  if (snap.exists()) {
    const d = snap.data();
    for (const f of (d.attachments ?? [])) {
      if (f.storagePath) await safeDeleteFile(f.storagePath);
    }
    await logActivity('Request deleted', d.title || d.maintenanceNumber);
  }
  await deleteDoc(doc(db, MNT_COL, id));
}

export async function getMaintenanceRequestById(id) {
  const snap = await getDoc(doc(db, MNT_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToMaintenanceRequests(
  callback,
  { statusFilter = 'all', priorityFilter = 'all', categoryFilter = 'all' } = {},
) {
  let q = query(collection(db, MNT_COL), orderBy('createdAt', 'desc'));

  if (statusFilter !== 'all') {
    q = query(
      collection(db, MNT_COL),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc'),
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      let requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (priorityFilter !== 'all') {
        requests = requests.filter((r) => r.priority === priorityFilter);
      }
      if (categoryFilter !== 'all') {
        requests = requests.filter((r) => r.category === categoryFilter);
      }
      callback({ requests, error: null });
    },
    (error) => callback({ requests: [], error }),
  );
}

export function subscribeToMaintenanceRequestById(id, callback) {
  return onSnapshot(
    doc(db, MNT_COL, id),
    (snap) => {
      if (snap.exists()) callback({ request: { id: snap.id, ...snap.data() }, error: null });
      else               callback({ request: null, error: null });
    },
    (error) => callback({ request: null, error }),
  );
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

export async function fetchAllMaintenanceRequests() {
  const snap = await getDocs(query(collection(db, MNT_COL), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
