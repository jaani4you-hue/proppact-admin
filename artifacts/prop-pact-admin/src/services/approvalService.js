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

// ── Create approval record ────────────────────────────────────────────────

export async function createApproval(type, entityId, entityData, reason = '') {
  try {
    await addDoc(collection(db, APPROVAL_COLLECTION), {
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
  } catch (err) {
    console.error('[createApproval] Error:', err.message);
  }
}

// ── Approve or reject approval ────────────────────────────────────────────

export async function approveApproval(approvalId, reviewerNotes = '') {
  try {
    await updateDoc(doc(db, APPROVAL_COLLECTION, approvalId), {
      status: APPROVAL_STATUS.APPROVED,
      reviewedBy: 'Admin',
      reviewedAt: serverTimestamp(),
      reviewNotes,
    });
  } catch (err) {
    console.error('[approveApproval] Error:', err.message);
    throw err;
  }
}

export async function rejectApproval(approvalId, reviewerNotes = '') {
  try {
    await updateDoc(doc(db, APPROVAL_COLLECTION, approvalId), {
      status: APPROVAL_STATUS.REJECTED,
      reviewedBy: 'Admin',
      reviewedAt: serverTimestamp(),
      reviewNotes,
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

// ── Get approval count by type ────────────────────────────────────────────

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
