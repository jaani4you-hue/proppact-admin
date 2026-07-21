/**
 * approvalService.js
 *
 * Manages approval workflows for:
 * - Owners
 * - Tenants
 * - Vendors
 * - Dealers
 * - Properties
 * - Projects
 *
 * Phase 3: emits realtime notifications on create / approve / reject.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';
import { notifyOnce } from './notificationService.js';

const APPROVAL_COLLECTION = 'approvals';

// ── Status constants ──────────────────────────────────────────────────────
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVIEW: 'in_review',
};

export const APPROVAL_TYPES = {
  OWNER: 'owner',
  TENANT: 'tenant',
  VENDOR: 'vendor',
  DEALER: 'dealer',
  PROPERTY: 'property',
  PROJECT: 'project',
};

// Pretty labels for notifications (e.g. `owner` → `Owner`)
const TYPE_LABEL = {
  owner   : 'Owner',
  tenant  : 'Tenant',
  vendor  : 'Vendor',
  dealer  : 'Dealer',
  property: 'Property',
  project : 'Project',
};

function labelFor(type) {
  return TYPE_LABEL[type] || (type ? String(type).replace(/^./, (c) => c.toUpperCase()) : 'Entity');
}

function entityName(entityData) {
  if (!entityData || typeof entityData !== 'object') return '';
  return entityData.name || entityData.title || entityData.fullName || entityData.propertyName || entityData.projectName || '';
}

// ── Create approval record ────────────────────────────────────────────────

export async function createApproval(type, entityId, entityData, reason = '') {
  try {
    const ref2 = await addDoc(collection(db, APPROVAL_COLLECTION), {
      type,
      entityId,
      entityData,
      reason,
      status: APPROVAL_STATUS.PENDING,
      requestedBy: 'System',
      requestedAt: serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: '',
    });

    const typeLabel = labelFor(type);
    const name      = entityName(entityData);
    await notifyOnce({
      type         : 'approval_request',
      title        : `New ${typeLabel} approval pending${name ? ` — ${name}` : ''}`,
      body         : reason
        ? `Awaiting admin review. ${reason}`
        : `A new ${typeLabel.toLowerCase()} record is awaiting admin approval.`,
      relatedId    : ref2.id,
      relatedModule: 'Approvals',
      relatedPath  : '/admin/approvals',
      cooldownHours: 0,
    });

    return ref2.id;
  } catch (err) {
    console.error('[createApproval] Error:', err.message);
    return null;
  }
}

// ── Approve or reject approval ────────────────────────────────────────────

export async function approveApproval(approvalId, reviewerNotes = '', context = {}) {
  try {
    await updateDoc(doc(db, APPROVAL_COLLECTION, approvalId), {
      status: APPROVAL_STATUS.APPROVED,
      reviewedBy: 'Admin',
      reviewedAt: serverTimestamp(),
      reviewNotes: reviewerNotes,
    });

    const typeLabel = labelFor(context.type);
    const name      = entityName(context.entityData);
    await notifyOnce({
      type         : 'approval_request',
      title        : `${typeLabel} approved${name ? ` — ${name}` : ''}`,
      body         : reviewerNotes
        ? `Approval granted. Notes: ${reviewerNotes}`
        : `The ${typeLabel.toLowerCase()} approval has been granted by admin.`,
      relatedId    : `${approvalId}_approved`,
      relatedModule: 'Approvals',
      relatedPath  : '/admin/approvals',
      cooldownHours: 1,
    });
  } catch (err) {
    console.error('[approveApproval] Error:', err.message);
    throw err;
  }
}

export async function rejectApproval(approvalId, reviewerNotes = '', context = {}) {
  try {
    await updateDoc(doc(db, APPROVAL_COLLECTION, approvalId), {
      status: APPROVAL_STATUS.REJECTED,
      reviewedBy: 'Admin',
      reviewedAt: serverTimestamp(),
      reviewNotes: reviewerNotes,
    });

    const typeLabel = labelFor(context.type);
    const name      = entityName(context.entityData);
    await notifyOnce({
      type         : 'approval_request',
      title        : `${typeLabel} rejected${name ? ` — ${name}` : ''}`,
      body         : reviewerNotes
        ? `Approval rejected. Reason: ${reviewerNotes}`
        : `The ${typeLabel.toLowerCase()} approval has been rejected by admin.`,
      relatedId    : `${approvalId}_rejected`,
      relatedModule: 'Approvals',
      relatedPath  : '/admin/approvals',
      cooldownHours: 1,
    });
  } catch (err) {
    console.error('[rejectApproval] Error:', err.message);
    throw err;
  }
}

// ── Get pending approvals ─────────────────────────────────────────────────

export function subscribeToPendingApprovals(callback, typeFilter = null) {
  try {
    let q;
    if (typeFilter) {
      q = query(
        collection(db, APPROVAL_COLLECTION),
        where('status', '==', APPROVAL_STATUS.PENDING),
        where('type', '==', typeFilter),
        orderBy('requestedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, APPROVAL_COLLECTION),
        where('status', '==', APPROVAL_STATUS.PENDING),
        orderBy('requestedAt', 'desc')
      );
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const approvals = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        callback({ approvals, error: null });
      },
      (error) => callback({ approvals: [], error })
    );
  } catch (err) {
    console.error('[subscribeToPendingApprovals] Error:', err.message);
    callback({ approvals: [], error: err });
    return () => {};
  }
}

// ── Realtime pending approval count (used by sidebar / bell) ──────────────

export function subscribeToPendingApprovalCount(callback) {
  try {
    return onSnapshot(
      query(
        collection(db, APPROVAL_COLLECTION),
        where('status', '==', APPROVAL_STATUS.PENDING)
      ),
      (snap) => callback(snap.size),
      () => callback(0)
    );
  } catch {
    callback(0);
    return () => {};
  }
}

// ── Get approval count by type (one-shot) ─────────────────────────────────

export async function getPendingApprovalCount(type = null) {
  try {
    let q;
    if (type) {
      q = query(
        collection(db, APPROVAL_COLLECTION),
        where('status', '==', APPROVAL_STATUS.PENDING),
        where('type', '==', type)
      );
    } else {
      q = query(
        collection(db, APPROVAL_COLLECTION),
        where('status', '==', APPROVAL_STATUS.PENDING)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (err) {
    console.error('[getPendingApprovalCount] Error:', err.message);
    return 0;
  }
}

// ── Get approval history ──────────────────────────────────────────────────

export function subscribeToApprovalHistory(callback, typeFilter = null) {
  try {
    let q;
    if (typeFilter) {
      q = query(
        collection(db, APPROVAL_COLLECTION),
        where('type', '==', typeFilter),
        orderBy('reviewedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, APPROVAL_COLLECTION),
        orderBy('reviewedAt', 'desc')
      );
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const history = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        callback({ history, error: null });
      },
      (error) => callback({ history: [], error })
    );
  } catch (err) {
    console.error('[subscribeToApprovalHistory] Error:', err.message);
    callback({ history: [], error: err });
    return () => {};
  }
}
