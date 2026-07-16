import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, UserCheck, Filter, X,
} from 'lucide-react';
import { useOwners } from '../../hooks/useOwners.js';
import { deleteOwner } from '../../services/ownerService.js';
import OwnerStatusBadge from '../../components/owners/OwnerStatusBadge.jsx';
import OwnerAvatar from '../../components/owners/OwnerAvatar.jsx';
import OwnerSkeletonTable, { OwnerSkeletonCards } from '../../components/owners/OwnerSkeletonTable.jsx';
import OwnerDeleteDialog from '../../components/owners/OwnerDeleteDialog.jsx';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRent(amount) {
  if (!amount && amount !== 0) return '—';
  const n = Number(amount);
  if (isNaN(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 mb-4">
        <UserCheck className="h-7 w-7 text-teal-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">
        {hasFilters ? 'No owners match your search' : 'No owners yet'}
      </p>
      <p className="mt-1 text-xs text-gray-400 max-w-xs">
        {hasFilters
          ? 'Try adjusting your search or filter.'
          : 'Add your first property owner to get started.'}
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

function ErrorState({ error }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <p className="text-sm font-semibold text-red-600">Failed to load owners</p>
      <p className="mt-1 text-xs text-gray-400">{error?.message ?? 'An unexpected error occurred.'}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OwnerList() {
  const navigate = useNavigate();

  const [searchQuery,   setSearchQuery]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(10);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  const { owners, totalCount, totalPages, currentPage, loading, error } = useOwners({
    statusFilter, searchQuery, page, pageSize,
  });

  const hasFilters = !!searchQuery.trim() || statusFilter !== 'all';

  function clearFilters() { setSearchQuery(''); setStatusFilter('all'); setPage(1); }

  function onSearch(e) { setSearchQuery(e.target.value); setPage(1); }

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteOwner(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message ?? 'Failed to delete owner.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget]);

  // Page number items (with ellipsis)
  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
    .reduce((acc, n, idx, arr) => {
      if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Owners</h1>
          <p className="mt-0.5 text-xs text-gray-500">Manage property owners and their information</p>
        </div>
        <button
          onClick={() => navigate('/admin/owners/new')}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          Add Owner
        </button>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, city…"
              value={searchQuery}
              onChange={onSearch}
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

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-sm text-gray-700 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              <span className="text-xs text-gray-400">
                {totalCount} {totalCount === 1 ? 'owner' : 'owners'}
              </span>
            )}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-sm text-gray-700 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors appearance-none cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>

        {error && !loading && <ErrorState error={error} />}

        {/* Table — desktop */}
        {!error && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="py-3 pl-5 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 w-8">#</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Owner</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Mobile</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Properties</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Rent Collected</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Status</th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Created</th>
                  <th className="py-3 pl-3 pr-5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <OwnerSkeletonTable rows={pageSize > 10 ? 10 : pageSize} />
                ) : owners && owners.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                    </td>
                  </tr>
                ) : (
                  (owners ?? []).map((owner, i) => {
                    const propCount = Array.isArray(owner.ownedProperties)
                      ? owner.ownedProperties.length
                      : owner.ownedProperties
                        ? String(owner.ownedProperties).split(',').filter(Boolean).length
                        : 0;
                    return (
                      <tr
                        key={owner.id}
                        className="group hover:bg-orange-50/40 transition-colors duration-100 border-b border-gray-50"
                      >
                        <td className="py-3.5 pl-5 pr-3 text-xs text-gray-400 font-mono">
                          {String((currentPage - 1) * pageSize + i + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <OwnerAvatar photo={owner.photo} name={owner.fullName} size="md" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                                {owner.fullName || '—'}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate max-w-[140px]">
                                {owner.email || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-sm text-gray-600 font-mono">{owner.mobile || '—'}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                            {propCount} {propCount === 1 ? 'property' : 'properties'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-sm font-medium text-gray-700">
                            {formatRent(owner.totalRentCollection)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <OwnerStatusBadge status={owner.status} />
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="text-xs text-gray-500">{formatDate(owner.createdAt)}</span>
                        </td>
                        <td className="py-3.5 pl-3 pr-5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/admin/owners/${owner.id}`)}
                              title="View"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/owners/${owner.id}/edit`)}
                              title="Edit"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(owner)}
                              title="Delete"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Cards — mobile */}
        {!error && (
          <div className="sm:hidden">
            {loading ? (
              <OwnerSkeletonCards rows={5} />
            ) : owners && owners.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
            ) : (
              <div className="divide-y divide-gray-100">
                {(owners ?? []).map((owner) => (
                  <div key={owner.id} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <OwnerAvatar photo={owner.photo} name={owner.fullName} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{owner.fullName || '—'}</p>
                            <p className="text-xs text-gray-500 truncate">{owner.email || '—'}</p>
                          </div>
                          <OwnerStatusBadge status={owner.status} />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500 font-mono">{owner.mobile || '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Rent: {formatRent(owner.totalRentCollection)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/owners/${owner.id}`)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/admin/owners/${owner.id}/edit`)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(owner)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            {pageItems.map((item, idx) =>
              item === '…' ? (
                <span key={`e-${idx}`} className="px-1 text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
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
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <OwnerDeleteDialog
        owner={deleteTarget}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
      />
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-lg text-sm text-red-600">
          {deleteError}
        </div>
      )}
    </div>
  );
}
