import { useEffect, useState } from 'react';
import {
  UserCheck, Check, X, Clock, Filter,
  User, Users2, Handshake, HardHat, Building2, FolderOpen,
} from 'lucide-react';
import {
  subscribeToPendingApprovals,
  subscribeToApprovalHistory,
  approveApproval,
  rejectApproval,
  APPROVAL_STATUS,
} from '../../services/approvalService.js';

// ── Icon + colour helpers ────────────────────────────────────────────────────

const TYPE_ICON = {
  owner   : User,
  tenant  : Users2,
  dealer  : Handshake,
  vendor  : HardHat,
  property: Building2,
  project : FolderOpen,
};

const TYPE_TINT = {
  owner   : 'bg-orange-50  text-orange-600  border-orange-100',
  tenant  : 'bg-blue-50    text-blue-600    border-blue-100',
  dealer  : 'bg-purple-50  text-purple-600  border-purple-100',
  vendor  : 'bg-amber-50   text-amber-700   border-amber-100',
  property: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  project : 'bg-sky-50     text-sky-600     border-sky-100',
};

const STATUS_TINT = {
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50   text-red-700   border-red-200',
  pending : 'bg-orange-50 text-orange-700 border-orange-200',
};

function fmtTime(v) {
  if (!v) return '—';
  const d = v?.toDate ? v.toDate() : new Date(v);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function labelFor(type) {
  if (!type) return 'Entity';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function entityName(entityData) {
  if (!entityData || typeof entityData !== 'object') return '';
  return entityData.name || entityData.title || entityData.fullName || entityData.propertyName || entityData.projectName || '';
}

// ── Approval row ─────────────────────────────────────────────────────────────

function ApprovalRow({ approval, onApprove, onReject, busy }) {
  const Icon = TYPE_ICON[approval.type] || UserCheck;
  const tint = TYPE_TINT[approval.type] || 'bg-gray-50 text-gray-600 border-gray-100';
  const name = entityName(approval.entityData) || approval.entityId || '—';
  const status = approval.status || 'pending';
  const isPending = status === APPROVAL_STATUS.PENDING;

  return (
    <div
      data-testid={`approval-row-${approval.id}`}
      className={[
        'group flex items-start gap-3.5 rounded-xl border p-4 transition-all',
        isPending
          ? 'border-orange-100 bg-orange-50/40 hover:border-orange-200'
          : 'border-gray-100 bg-white hover:border-gray-200',
      ].join(' ')}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${tint}`}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {labelFor(approval.type)} — {name}
            </p>
            {approval.reason && (
              <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{approval.reason}</p>
            )}
            {!approval.reason && approval.entityData?.email && (
              <p className="mt-0.5 text-xs text-gray-500 truncate">{approval.entityData.email}</p>
            )}
          </div>

          {isPending && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                data-testid={`approve-${approval.id}`}
                onClick={() => onApprove(approval)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60 transition-colors"
                title="Approve"
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </button>
              <button
                data-testid={`reject-${approval.id}`}
                onClick={() => onReject(approval)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
                title="Reject"
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${tint}`}>
            {labelFor(approval.type)}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${STATUS_TINT[status] || STATUS_TINT.pending}`}>
            {status.replace('_', ' ').toUpperCase()}
          </span>
          {approval.reviewedBy && !isPending && (
            <span className="text-[10px] text-gray-400">by {approval.reviewedBy}</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="h-3 w-3" />
            {fmtTime(isPending ? approval.requestedAt : approval.reviewedAt)}
          </span>
        </div>

        {approval.reviewNotes && !isPending && (
          <p className="mt-1.5 text-[11px] text-gray-500 italic line-clamp-2">
            “{approval.reviewNotes}”
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ApprovalList() {
  const [pending,  setPending]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [tab,      setTab]      = useState('pending'); // 'pending' | 'history'
  const [busyId,   setBusyId]   = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubPending = subscribeToPendingApprovals(({ approvals, error: e }) => {
      setPending(approvals);
      setError(e);
      setLoading(false);
    });
    const unsubHistory = subscribeToApprovalHistory(({ history: h, error: e }) => {
      // exclude records still pending (they can appear here if reviewedAt is set to null but status changed elsewhere)
      setHistory(h.filter((a) => a.status !== APPROVAL_STATUS.PENDING));
      if (e) setError(e);
    });
    return () => { unsubPending(); unsubHistory(); };
  }, []);

  async function handleApprove(approval) {
    setBusyId(approval.id);
    try {
      await approveApproval(approval.id, '', { type: approval.type, entityData: approval.entityData });
    } catch (e) {
      setError(e);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(approval) {
    setBusyId(approval.id);
    try {
      await rejectApproval(approval.id, '', { type: approval.type, entityData: approval.entityData });
    } catch (e) {
      setError(e);
    } finally {
      setBusyId(null);
    }
  }

  const rows = tab === 'pending' ? pending : history;

  return (
    <div className="space-y-6" data-testid="approvals-page">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Approvals</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {pending.length > 0
              ? `${pending.length} pending approval${pending.length !== 1 ? 's' : ''}`
              : 'All caught up — nothing pending.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {[
            { value: 'pending', label: `Pending${pending.length ? ` (${pending.length})` : ''}` },
            { value: 'history', label: 'History' },
          ].map((o) => (
            <button
              key={o.value}
              data-testid={`approvals-tab-${o.value}`}
              onClick={() => setTab(o.value)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                tab === o.value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-orange-600',
              ].join(' ')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load approvals: {error.message}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-gray-100 bg-white animate-pulse shadow-sm" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <UserCheck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">
            {tab === 'pending' ? 'No pending approvals' : 'No approval history yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {tab === 'pending'
              ? 'New approval requests will appear here in real-time.'
              : 'Approved and rejected records will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => (
            <ApprovalRow
              key={a.id}
              approval={a}
              onApprove={handleApprove}
              onReject={handleReject}
              busy={busyId === a.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
