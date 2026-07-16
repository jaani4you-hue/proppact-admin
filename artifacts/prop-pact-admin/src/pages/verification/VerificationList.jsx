import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Filter,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  LayoutList,
} from 'lucide-react';
import { useVerifications } from '../../hooks/useVerifications.js';
import { deleteVerification } from '../../services/verificationService.js';
import VerificationStatusBadge from '../../components/verification/VerificationStatusBadge.jsx';
import {
  SkeletonTableRows,
  SkeletonCards,
} from '../../components/verification/VerificationSkeleton.jsx';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const TABS = [
  { key: 'all',       label: 'All',       icon: LayoutList   },
  { key: 'Pending',   label: 'Pending',   icon: Clock        },
  { key: 'In Review', label: 'In Review', icon: ShieldCheck  },
  { key: 'Approved',  label: 'Approved',  icon: CheckCircle2 },
  { key: 'Rejected',  label: 'Rejected',  icon: XCircle      },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 mb-4">
        <ShieldCheck className="h-7 w-7 text-amber-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">
        {hasFilters ? 'No verifications match your search' : 'No verification requests yet'}
      </p>
      <p className="mt-1 text-xs text-gray-400 max-w-xs">
        {hasFilters
          ? 'Try adjusting your search or filter.'
          : 'Verification requests will appear here once submitted.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-orange-200 hover:text-orange-600 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────────

function ErrorState({ error }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <p className="text-sm font-semibold text-red-600">Failed to load verifications</p>
      <p className="mt-1 text-xs text-gray-400">{error?.message ?? 'An unexpected error occurred.'}</p>
    </div>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────────

function DeleteDialog({ item, loading, onConfirm, onCancel }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 mx-auto mb-4">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="text-center text-base font-semibold text-gray-800">Delete Verification?</h3>
        <p className="mt-1.5 text-center text-sm text-gray-500">
          <span className="font-medium text-gray-700">{item.propertyName || 'This record'}</span> will be permanently deleted.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ currentPage, totalPages, totalCount, pageSize, loading, onPage }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
    .reduce((acc, n, idx, arr) => {
      if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/60 flex-wrap gap-2">
      <p className="text-xs text-gray-400">
        {loading
          ? 'Loading…'
          : totalCount === 0
          ? 'No results'
          : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalCount)} of ${totalCount}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>
        {pages.map((item, idx) =>
          item === '…' ? (
            <span key={`e-${idx}`} className="px-1 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={item}
              onClick={() => onPage(item)}
              disabled={loading}
              className={[
                'min-w-[28px] h-7 rounded-md border text-xs font-medium transition-colors',
                item === currentPage
                  ? 'border-orange-400 bg-orange-500 text-white'
                  : 'border-gray-200 text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600',
              ].join(' ')}
            >
              {item}
            </button>
          ),
        )}
        <button
          onClick={() => onPage(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VerificationList() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab]         = useState('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [typeFilter, setTypeFilter]       = useState('all');
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(10);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState(null);
  const [toast, setToast]                 = useState(null);

  // Status filter comes from active tab
  const statusFilter = activeTab;

  const { verifications, totalCount, totalPages, currentPage, loading, error } = useVerifications({
    statusFilter,
    searchQuery: typeFilter !== 'all' ? searchQuery : searchQuery,
    page,
    pageSize,
  });

  // Client-side type filter on top of hook results
  const displayed = typeFilter !== 'all'
    ? verifications.filter((v) => (v.propertyType ?? '') === typeFilter)
    : verifications;

  const hasFilters = !!searchQuery.trim() || typeFilter !== 'all';

  function handleClearFilters() {
    setSearchQuery('');
    setTypeFilter('all');
    setPage(1);
  }

  function handleTabChange(key) {
    setActiveTab(key);
    setPage(1);
  }

  function showToast(msg, type = 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteVerification(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Verification deleted.', 'success');
    } catch (err) {
      setDeleteError(err.message ?? 'Failed to delete.');
      showToast(err.message ?? 'Failed to delete.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget]);

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Verification Requests</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage property verification requests in real-time
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/verification/new')}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 px-4 pt-4 border-b border-gray-100 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-colors -mb-px',
                activeTab === key
                  ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search property, owner, address…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8.5 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Property type filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-sm text-gray-700 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Plot">Plot</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              <span className="text-xs text-gray-400">
                {totalCount} {totalCount === 1 ? 'record' : 'records'}
              </span>
            )}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-sm text-gray-700 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors appearance-none cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && !loading && <ErrorState error={error} />}

        {/* Table — desktop */}
        {!error && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="py-3 pl-5 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 w-8">#</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Property</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Owner</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Type</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Status</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Officer</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Submitted</th>
                  <th className="py-3 pl-3 pr-5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTableRows rows={pageSize > 10 ? 10 : pageSize} />
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState hasFilters={hasFilters} onClear={handleClearFilters} />
                    </td>
                  </tr>
                ) : (
                  displayed.map((item, i) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-orange-50/40 transition-colors duration-100 border-b border-gray-50 cursor-pointer"
                      onClick={() => navigate(`/admin/verification/${item.id}`)}
                    >
                      <td className="py-3.5 pl-5 pr-3 text-xs text-gray-400 font-mono">
                        {String((currentPage - 1) * pageSize + i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">
                          {item.propertyName || '—'}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]">
                          {item.propertyAddress || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-sm text-gray-700 truncate max-w-[120px]">{item.ownerName || '—'}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{item.ownerContact || ''}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {item.propertyType || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <VerificationStatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-sm text-gray-600">
                          {item.assignedOfficer || <span className="text-gray-300 italic">Unassigned</span>}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                      </td>
                      <td className="py-3.5 pl-3 pr-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/verification/${item.id}`)}
                            title="View"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Cards — mobile */}
        {!error && (
          <div className="sm:hidden">
            {loading ? (
              <SkeletonCards rows={5} />
            ) : displayed.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={handleClearFilters} />
            ) : (
              <div className="divide-y divide-gray-100">
                {displayed.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-4"
                    onClick={() => navigate(`/admin/verification/${item.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.propertyName || '—'}
                      </p>
                      <VerificationStatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.propertyAddress || '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Owner: {item.ownerName || '—'}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {item.propertyType || 'Unknown'}
                      </span>
                      <span className="text-[11px] text-gray-400">{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/verification/${item.id}`); }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          loading={loading}
          onPage={setPage}
        />
      </div>

      {/* Delete dialog */}
      <DeleteDialog
        item={deleteTarget}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
      />

      {/* Toast */}
      {toast && (
        <div
          className={[
            'fixed bottom-4 right-4 z-50 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium',
            toast.type === 'success'
              ? 'border-emerald-200 bg-white text-emerald-600'
              : 'border-red-200 bg-white text-red-600',
          ].join(' ')}
        >
          {toast.msg}
        </div>
      )}
      {deleteError && !toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-lg text-sm text-red-600">
          {deleteError}
        </div>
      )}
    </div>
  );
}
