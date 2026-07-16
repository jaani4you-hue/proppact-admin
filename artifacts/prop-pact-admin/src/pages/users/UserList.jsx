import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, Users, Filter, X,
} from 'lucide-react';
import { useUsers } from '../../hooks/useUsers.js';
import { deleteUser } from '../../services/userService.js';
import UserStatusBadge, { UserRoleBadge } from '../../components/users/UserStatusBadge.jsx';
import UserAvatar from '../../components/users/UserAvatar.jsx';
import UserSkeletonTable, { UserSkeletonCards } from '../../components/users/UserSkeletonTable.jsx';
import UserDeleteDialog from '../../components/users/UserDeleteDialog.jsx';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const ROLES    = ['Admin', 'Manager', 'Agent', 'Viewer'];
const STATUSES = ['Active', 'Inactive', 'Suspended'];

function fmtDate(ts) {
  if (!ts) return '—';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 mb-4">
        <Users className="h-7 w-7 text-violet-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">
        {hasFilters ? 'No users match your search' : 'No users yet'}
      </p>
      <p className="mt-1 text-xs text-gray-400 max-w-xs">
        {hasFilters ? 'Try adjusting your search or filters.' : 'Add your first user to get started.'}
      </p>
      {hasFilters && (
        <button onClick={onClear}
          className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-orange-200 hover:text-orange-600 transition-colors">
          Clear filters
        </button>
      )}
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <p className="text-sm font-semibold text-red-600">Failed to load users</p>
      <p className="mt-1 text-xs text-gray-400">{error?.message ?? 'An unexpected error occurred.'}</p>
    </div>
  );
}

export default function UserList() {
  const navigate = useNavigate();

  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [roleFilter,    setRoleFilter]    = useState('all');
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(10);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  const { users, totalCount, totalPages, currentPage, loading, error } = useUsers({
    statusFilter, roleFilter, searchQuery: search, page, pageSize,
  });

  const hasFilters = !!search.trim() || statusFilter !== 'all' || roleFilter !== 'all';
  function clearFilters() { setSearch(''); setStatusFilter('all'); setRoleFilter('all'); setPage(1); }

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message ?? 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget]);

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
          <h1 className="text-lg font-bold text-gray-800">Users</h1>
          <p className="mt-0.5 text-xs text-gray-500">Manage admin users, roles and permissions</p>
        </div>
        <button onClick={() => navigate('/admin/users/new')}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all duration-150">
          <Plus className="h-4 w-4" />Add User
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text" placeholder="Search by name, email, mobile, role…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8.5 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            {/* Role filter */}
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-sm text-gray-700 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors appearance-none cursor-pointer">
              <option value="all">All Roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {/* Status filter */}
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-sm text-gray-700 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors appearance-none cursor-pointer">
              <option value="all">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              <span className="text-xs text-gray-400">
                {totalCount} {totalCount === 1 ? 'user' : 'users'}
              </span>
            )}
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-sm text-gray-700 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors appearance-none cursor-pointer">
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
                  {['#', 'User', 'Mobile', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                    <th key={h}
                      className={`py-3 ${i === 0 ? 'pl-5 pr-3 w-8' : i === 6 ? 'pl-3 pr-5' : 'px-3'} text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <UserSkeletonTable rows={Math.min(pageSize, 10)} />
                ) : users && users.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState hasFilters={hasFilters} onClear={clearFilters} /></td></tr>
                ) : (
                  (users ?? []).map((u, i) => (
                    <tr key={u.id}
                      className="group hover:bg-orange-50/40 transition-colors duration-100 border-b border-gray-50">
                      <td className="py-3.5 pl-5 pr-3 text-xs text-gray-400 font-mono">
                        {String((currentPage - 1) * pageSize + i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar photo={u.photo} name={u.fullName} size="md" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{u.fullName || '—'}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{u.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-sm text-gray-600">{u.mobile || '—'}</td>
                      <td className="py-3.5 px-3"><UserRoleBadge role={u.role} /></td>
                      <td className="py-3.5 px-3"><UserStatusBadge status={u.status} /></td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-xs text-gray-500">{fmtDate(u.createdAt)}</span>
                      </td>
                      <td className="py-3.5 pl-3 pr-5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/admin/users/${u.id}`)} title="View"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => navigate(`/admin/users/${u.id}/edit`)} title="Edit"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(u)} title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
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
              <UserSkeletonCards rows={5} />
            ) : users && users.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
            ) : (
              <div className="divide-y divide-gray-100">
                {(users ?? []).map((u) => (
                  <div key={u.id} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar photo={u.photo} name={u.fullName} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName || '—'}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email || '—'}</p>
                          </div>
                          <UserStatusBadge status={u.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <UserRoleBadge role={u.role} />
                          <span className="text-xs text-gray-400 font-mono">{u.mobile || '—'}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => navigate(`/admin/users/${u.id}`)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors">
                            View
                          </button>
                          <button onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => setDeleteTarget(u)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
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
            {loading ? 'Loading…' : totalCount === 0 ? 'No results' :
              `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalCount)} of ${totalCount}`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="h-3.5 w-3.5" />Previous
            </button>
            {pageItems.map((item, idx) =>
              item === '…' ? (
                <span key={`e${idx}`} className="px-1 text-xs text-gray-400">…</span>
              ) : (
                <button key={item} onClick={() => setPage(item)} disabled={loading}
                  className={`min-w-[28px] h-7 rounded-md border text-xs font-medium transition-colors ${item === currentPage ? 'border-orange-400 bg-orange-500 text-white' : 'border-gray-200 text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600'}`}>
                  {item}
                </button>
              )
            )}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Next<ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <UserDeleteDialog
        user={deleteTarget} loading={deleteLoading}
        onConfirm={confirmDelete}
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
