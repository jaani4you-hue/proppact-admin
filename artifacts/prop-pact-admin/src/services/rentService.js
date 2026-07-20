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
import { db } from '../firebase/firebase.js';
import { notifyOnce } from './notificationService.js';

const RENTS_COL    = 'rents';
const PAYMENTS_COL = 'rentPayments';
const RECEIPTS_COL = 'rentReceipts';

// ── Receipt number ────────────────────────────────────────────────────────────

function generateReceiptNumber() {
  const now   = new Date();
  const yy    = now.getFullYear().toString().slice(2);
  const mm    = String(now.getMonth() + 1).padStart(2, '0');
  const rand  = Math.floor(Math.random() * 9000) + 1000;
  return `RCP-${yy}${mm}-${rand}`;
}

// ── Activity log ──────────────────────────────────────────────────────────────

async function logActivity(action, label = '') {
  try {
    const now = new Date();
    await addDoc(collection(db, 'adminLogs'), {
      activity : action + (label ? `: ${label}` : ''),
      user     : 'Admin',
      module   : 'Rent',
      status   : action.startsWith('Deleted') ? 'Rejected' : 'Approved',
      timestamp: serverTimestamp(),
      date     : now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time     : now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch { /* non-fatal */ }
}

// ── Status helper ─────────────────────────────────────────────────────────────

export function computeRentStatus(monthlyRent, paidAmount, dueDay) {
  const paid  = Number(paidAmount)  || 0;
  const rent  = Number(monthlyRent) || 0;
  if (paid >= rent) return 'Paid';
  const today   = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), Number(dueDay) || 1);
  if (paid > 0 && paid < rent) return 'Partial';
  if (today > dueDate)         return 'Overdue';
  return 'Pending';
}

// ── CRUD: rents ───────────────────────────────────────────────────────────────

export async function createRent(data) {
  const status = computeRentStatus(data.monthlyRent, data.paidAmount ?? 0, data.dueDay ?? 1);
  const payload = {
    ...data,
    paidAmount        : Number(data.paidAmount)   || 0,
    outstandingBalance: Number(data.monthlyRent)  - (Number(data.paidAmount) || 0),
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, RENTS_COL), payload);
  await logActivity('Rent created', data.tenantName);
  if (status === 'Overdue') {
    await notifyOnce({
      type         : 'rent_reminder',
      title        : `Rent Overdue — ${data.propertyName || 'Property'}`,
      body         : `${data.tenantName || 'Tenant'} has an overdue rent of ₹${(Number(data.monthlyRent) || 0).toLocaleString('en-IN')}.`,
      relatedId    : ref.id,
      relatedModule: 'Rent',
      relatedPath  : `/admin/rent/${ref.id}`,
    });
  }
  return ref.id;
}

export async function updateRent(id, data) {
  const status = computeRentStatus(data.monthlyRent, data.paidAmount ?? 0, data.dueDay ?? 1);
  const payload = {
    ...data,
    paidAmount        : Number(data.paidAmount)   || 0,
    outstandingBalance: Number(data.monthlyRent)  - (Number(data.paidAmount) || 0),
    status,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, RENTS_COL, id), payload);
  await logActivity('Rent updated', data.tenantName);
  if (status === 'Overdue') {
    await notifyOnce({
      type         : 'rent_reminder',
      title        : `Rent Overdue — ${data.propertyName || 'Property'}`,
      body         : `${data.tenantName || 'Tenant'} has an overdue balance of ₹${((Number(data.monthlyRent) || 0) - (Number(data.paidAmount) || 0)).toLocaleString('en-IN')}.`,
      relatedId    : id,
      relatedModule: 'Rent',
      relatedPath  : `/admin/rent/${id}`,
    });
  }
}

export async function deleteRent(id) {
  const snap = await getDoc(doc(db, RENTS_COL, id));
  if (snap.exists()) await logActivity('Rent deleted', snap.data().tenantName);
  await deleteDoc(doc(db, RENTS_COL, id));
}

export async function getRentById(id) {
  const snap = await getDoc(doc(db, RENTS_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToRents(callback, { statusFilter = 'all' } = {}) {
  let q = query(collection(db, RENTS_COL), orderBy('createdAt', 'desc'));
  if (statusFilter !== 'all') {
    q = query(
      collection(db, RENTS_COL),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc'),
    );
  }
  return onSnapshot(
    q,
    (snapshot) => callback({ rents: snapshot.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
    (error)    => callback({ rents: [], error }),
  );
}

export function subscribeToRentById(id, callback) {
  return onSnapshot(
    doc(db, RENTS_COL, id),
    (snap) => {
      if (snap.exists()) callback({ rent: { id: snap.id, ...snap.data() }, error: null });
      else               callback({ rent: null, error: null });
    },
    (error) => callback({ rent: null, error }),
  );
}

export function subscribeToPayments(rentId, callback) {
  const q = query(
    collection(db, PAYMENTS_COL),
    where('rentId', '==', rentId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => callback({ payments: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
    (error) => callback({ payments: [], error }),
  );
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function addPayment(rentId, paymentData) {
  const rentSnap = await getDoc(doc(db, RENTS_COL, rentId));
  if (!rentSnap.exists()) throw new Error('Rent record not found');
  const rent = { id: rentSnap.id, ...rentSnap.data() };

  const receiptNumber    = generateReceiptNumber();
  const amount           = Number(paymentData.amount) || 0;
  const newPaidAmount    = (Number(rent.paidAmount) || 0) + amount;
  const outstandingBal   = Math.max(0, Number(rent.monthlyRent) - newPaidAmount);
  const newStatus        = computeRentStatus(rent.monthlyRent, newPaidAmount, rent.dueDay ?? 1);
  const paidDate         = paymentData.paidDate || new Date().toISOString().slice(0, 10);

  // Payment record
  const payRef = await addDoc(collection(db, PAYMENTS_COL), {
    rentId,
    tenantName   : rent.tenantName   || '',
    propertyName : rent.propertyName || '',
    ownerName    : rent.ownerName    || '',
    amount,
    paymentType  : paymentData.paymentType   || 'Full',
    paymentMethod: paymentData.paymentMethod || 'Cash',
    paidDate,
    notes        : paymentData.notes || '',
    receiptNumber,
    createdAt    : serverTimestamp(),
  });

  // Receipt record
  await addDoc(collection(db, RECEIPTS_COL), {
    rentId,
    paymentId      : payRef.id,
    receiptNumber,
    tenantName     : rent.tenantName     || '',
    tenantId       : rent.tenantId       || '',
    propertyName   : rent.propertyName   || '',
    propertyAddress: rent.propertyAddress || '',
    ownerName      : rent.ownerName      || '',
    amount,
    paymentType    : paymentData.paymentType   || 'Full',
    paymentMethod  : paymentData.paymentMethod || 'Cash',
    paidDate,
    monthlyRent    : rent.monthlyRent || 0,
    generatedAt    : serverTimestamp(),
  });

  // Update rent
  await updateDoc(doc(db, RENTS_COL, rentId), {
    paidAmount        : newPaidAmount,
    outstandingBalance: outstandingBal,
    status            : newStatus,
    lastPaymentDate   : paidDate,
    updatedAt         : serverTimestamp(),
  });

  await logActivity(`Payment (${paymentData.paymentType || 'Full'})`, rent.tenantName);
  return { paymentId: payRef.id, receiptNumber };
}

// ── Reports data ──────────────────────────────────────────────────────────────

export async function fetchAllRents() {
  const snap = await getDocs(query(collection(db, RENTS_COL), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAllPayments() {
  const snap = await getDocs(query(collection(db, PAYMENTS_COL), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Receipt print (no external lib needed) ────────────────────────────────────

export function printReceipt(receipt) {
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; background: #fff; margin: 0; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 800; color: #f97316; }
    .brand small { display: block; font-size: 11px; font-weight: 400; color: #666; }
    .receipt-no { text-align: right; }
    .receipt-no strong { font-size: 15px; color: #f97316; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 0 0 8px; }
    .section p { margin: 2px 0; font-size: 14px; }
    .amount-box { border: 2px solid #f97316; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
    .amount-box .label { font-size: 12px; color: #888; }
    .amount-box .value { font-size: 32px; font-weight: 800; color: #f97316; }
    .footer { border-top: 1px solid #eee; padding-top: 16px; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">PropPact<small>Property Management</small></div>
    </div>
    <div class="receipt-no">
      <div style="font-size:11px;color:#888;margin-bottom:4px">PAYMENT RECEIPT</div>
      <strong>${receipt.receiptNumber}</strong>
      <div style="font-size:12px;color:#666;margin-top:4px">Date: ${receipt.paidDate || ''}</div>
    </div>
  </div>
  <div class="grid">
    <div class="section">
      <h3>Tenant</h3>
      <p><strong>${receipt.tenantName || '—'}</strong></p>
    </div>
    <div class="section">
      <h3>Property</h3>
      <p><strong>${receipt.propertyName || '—'}</strong></p>
      <p style="font-size:12px;color:#666">${receipt.propertyAddress || ''}</p>
    </div>
    <div class="section">
      <h3>Owner</h3>
      <p>${receipt.ownerName || '—'}</p>
    </div>
    <div class="section">
      <h3>Payment Method</h3>
      <p>${receipt.paymentMethod || '—'}</p>
      <p style="font-size:12px;color:#666">Type: ${receipt.paymentType || '—'}</p>
    </div>
  </div>
  <div class="amount-box">
    <div class="label">Amount Paid</div>
    <div class="value">${fmt(receipt.amount)}</div>
    <div style="font-size:12px;color:#888;margin-top:4px">Monthly Rent: ${fmt(receipt.monthlyRent)}</div>
  </div>
  <div class="footer">
    This is a computer-generated receipt. No signature required.<br/>
    PropPact Admin — Property Management System
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=700,height=600');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
