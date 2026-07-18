import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, orderBy,
  serverTimestamp, where,
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/firebase.js';

const PROJECTS_COL = 'projects';
const UNITS_COL    = 'projectUnits';

// ── ID / code generators ──────────────────────────────────────────────────────

export function generateProjectCode() {
  const now  = new Date();
  const yy   = now.getFullYear().toString().slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PRJ-${yy}${mm}-${rand}`;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export async function uploadFile(file, folder) {
  const ext      = file.name.split('.').pop();
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storRef  = ref(storage, `${folder}/${safeName}`);
  const snap = await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storRef, file);
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

async function safeDelete(storagePath) {
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
      module   : 'Projects',
      status   : action.startsWith('Deleted') ? 'Rejected' : 'Approved',
      timestamp: serverTimestamp(),
      date     : now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time     : now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch { /* non-fatal */ }
}

// ── CRUD: projects ────────────────────────────────────────────────────────────

export async function createProject(data, imageFiles = [], docFiles = []) {
  const uploadedImages = await Promise.all(imageFiles.map((f) => uploadFile(f, 'projects/images')));
  const uploadedDocs   = await Promise.all(docFiles.map((f)   => uploadFile(f, 'projects/documents')));

  const payload = {
    ...data,
    projectCode   : data.projectCode || generateProjectCode(),
    status        : data.status      || 'Upcoming',
    amenities     : data.amenities   ?? [],
    images        : [...(data.images    ?? []), ...uploadedImages],
    documents     : [...(data.documents ?? []), ...uploadedDocs],
    totalUnits    : Number(data.totalUnits)    || 0,
    totalFlats    : Number(data.totalFlats)    || 0,
    totalVillas   : Number(data.totalVillas)   || 0,
    totalShops    : Number(data.totalShops)    || 0,
    totalPlots    : Number(data.totalPlots)    || 0,
    totalTowers   : Number(data.totalTowers)   || 0,
    totalFloors   : Number(data.totalFloors)   || 0,
    availableUnits: Number(data.availableUnits)|| 0,
    soldUnits     : Number(data.soldUnits)     || 0,
    reservedUnits : Number(data.reservedUnits) || 0,
    minPrice      : Number(data.minPrice)      || 0,
    maxPrice      : Number(data.maxPrice)      || 0,
    pricePerSqft  : Number(data.pricePerSqft)  || 0,
    createdAt     : serverTimestamp(),
    updatedAt     : serverTimestamp(),
  };

  const ref2 = await addDoc(collection(db, PROJECTS_COL), payload);
  await logActivity('Project created', data.projectName);
  return ref2.id;
}

export async function updateProject(id, data, newImageFiles = [], newDocFiles = []) {
  const uploadedImages = await Promise.all(newImageFiles.map((f) => uploadFile(f, 'projects/images')));
  const uploadedDocs   = await Promise.all(newDocFiles.map((f)   => uploadFile(f, 'projects/documents')));

  const payload = {
    ...data,
    images    : [...(data.images    ?? []), ...uploadedImages],
    documents : [...(data.documents ?? []), ...uploadedDocs],
    totalUnits    : Number(data.totalUnits)    || 0,
    totalFlats    : Number(data.totalFlats)    || 0,
    totalVillas   : Number(data.totalVillas)   || 0,
    totalShops    : Number(data.totalShops)    || 0,
    totalPlots    : Number(data.totalPlots)    || 0,
    totalTowers   : Number(data.totalTowers)   || 0,
    totalFloors   : Number(data.totalFloors)   || 0,
    availableUnits: Number(data.availableUnits)|| 0,
    soldUnits     : Number(data.soldUnits)     || 0,
    reservedUnits : Number(data.reservedUnits) || 0,
    minPrice      : Number(data.minPrice)      || 0,
    maxPrice      : Number(data.maxPrice)      || 0,
    pricePerSqft  : Number(data.pricePerSqft)  || 0,
    updatedAt     : serverTimestamp(),
  };

  await updateDoc(doc(db, PROJECTS_COL, id), payload);
  await logActivity('Project updated', data.projectName);
}

export async function deleteProject(id) {
  const snap = await getDoc(doc(db, PROJECTS_COL, id));
  if (snap.exists()) {
    const d = snap.data();
    for (const f of [...(d.images ?? []), ...(d.documents ?? [])]) {
      if (f.storagePath) await safeDelete(f.storagePath);
    }
    await logActivity('Project deleted', d.projectName);
  }
  // delete all units for this project
  const unitsSnap = await getDocs(query(collection(db, UNITS_COL), where('projectId', '==', id)));
  await Promise.all(unitsSnap.docs.map((d2) => deleteDoc(d2.ref)));
  await deleteDoc(doc(db, PROJECTS_COL, id));
}

export async function getProjectById(id) {
  const snap = await getDoc(doc(db, PROJECTS_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToProjects(callback, { statusFilter = 'all', typeFilter = 'all' } = {}) {
  let q = query(collection(db, PROJECTS_COL), orderBy('createdAt', 'desc'));
  if (statusFilter !== 'all') {
    q = query(collection(db, PROJECTS_COL), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
  }
  return onSnapshot(
    q,
    (snap) => {
      let projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (typeFilter !== 'all') projects = projects.filter((p) => p.projectType === typeFilter);
      callback({ projects, error: null });
    },
    (error) => callback({ projects: [], error }),
  );
}

export function subscribeToProjectById(id, callback) {
  return onSnapshot(
    doc(db, PROJECTS_COL, id),
    (snap) => {
      if (snap.exists()) callback({ project: { id: snap.id, ...snap.data() }, error: null });
      else               callback({ project: null, error: null });
    },
    (error) => callback({ project: null, error }),
  );
}

// ── Units CRUD ────────────────────────────────────────────────────────────────

export async function addUnit(projectId, data) {
  const projSnap = await getDoc(doc(db, PROJECTS_COL, projectId));
  const projectName = projSnap.exists() ? projSnap.data().projectName : '';

  const ref2 = await addDoc(collection(db, UNITS_COL), {
    ...data,
    projectId,
    projectName,
    floor         : Number(data.floor)  || 0,
    area          : Number(data.area)   || 0,
    price         : Number(data.price)  || 0,
    status        : data.status         || 'Available',
    parkingIncluded: Boolean(data.parkingIncluded),
    createdAt     : serverTimestamp(),
    updatedAt     : serverTimestamp(),
  });

  await logActivity(`Unit added (${data.unitType} ${data.unitNumber})`, projectName);

  // Recalculate project unit counts
  await recalcProjectUnits(projectId);

  return ref2.id;
}

export async function updateUnit(unitId, data) {
  await updateDoc(doc(db, UNITS_COL, unitId), {
    ...data,
    floor  : Number(data.floor)  || 0,
    area   : Number(data.area)   || 0,
    price  : Number(data.price)  || 0,
    updatedAt: serverTimestamp(),
  });
  if (data.projectId) await recalcProjectUnits(data.projectId);
}

export async function deleteUnit(unitId, projectId) {
  await deleteDoc(doc(db, UNITS_COL, unitId));
  if (projectId) await recalcProjectUnits(projectId);
}

export async function updateUnitStatus(unitId, status, bookingData = {}) {
  await updateDoc(doc(db, UNITS_COL, unitId), {
    status,
    ...bookingData,
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(doc(db, UNITS_COL, unitId));
  if (snap.exists() && snap.data().projectId) {
    await recalcProjectUnits(snap.data().projectId);
  }
}

async function recalcProjectUnits(projectId) {
  const snap = await getDocs(query(collection(db, UNITS_COL), where('projectId', '==', projectId)));
  const units = snap.docs.map((d) => d.data());
  await updateDoc(doc(db, PROJECTS_COL, projectId), {
    totalUnits    : units.length,
    availableUnits: units.filter((u) => u.status === 'Available').length,
    soldUnits     : units.filter((u) => u.status === 'Sold').length,
    reservedUnits : units.filter((u) => u.status === 'Reserved' || u.status === 'Booked').length,
    updatedAt     : serverTimestamp(),
  });
}

export function subscribeToUnits(projectId, callback) {
  const q = query(
    collection(db, UNITS_COL),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) => callback({ units: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
    (error) => callback({ units: [], error }),
  );
}

export async function fetchAllProjects() {
  const snap = await getDocs(query(collection(db, PROJECTS_COL), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
