import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  HardHat, Users, CheckCircle2, XCircle, Star, BarChart3,
} from 'lucide-react';
import { useVendors } from '../../hooks/useVendors.js';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge.jsx';
import { VendorSkeletonTable } from '../../components/vendors/VendorSkeletonTable.jsx';
import VendorDeleteDialog from '../../components/vendors/VendorDeleteDialog.jsx';

const VENDOR_CATEGORIES = [
  'all', 'Plumber', 'Electrician', 'Civil/Structural', 'Painter', 'Carpenter',
  'HVAC', 'Pest Control', 'Cleaning', 'Lift/Elevator', 'General',
];
const STATUS_FILTERS = ['all', 'Active', 'Inactive', 'Blacklisted'];

function StatCard({ icon: Icon, label, value, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-50  text-orange-500  border-orange-100',
    green : 'bg-green-50   text-green-600   border-green-100',
    gray  : 'bg-gray-50    text-gray-500    border-gray-100',
    red   : 'bg-red-50     text-red-500     border-red-100',
    blue  : 'bg-blue-50    text-blue-600    border-blue-100',
  };
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${colors[color] ?? colors.gray}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  const n = Number(rating) || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      {n > 0 && <span className="ml-1 text-xs text-gray-500">{n}</span>}
    </div>
  );
}

export default function VendorList() {
  const navigate = useNavigate();
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [showCatFilter,  setShowCatFilter]  = useState(false);

  const { vendors, loading, error, page, setPage, totalPages, totalCount, stats } =
    useVendors({ statusFilter, categoryFilter, search });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage contractors and service providers for maintenance work
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/vendors/new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={HardHat}     label="Total Vendors" value={stats.total}       color="orange" />
        <StatCard icon={CheckCircle2} label="Active"       value={stats.active}      color="green"  />
        <StatCard icon={XCircle}     label="Inactive"      value={stats.inactive}    color="gray"   />
        <StatCard icon={Star}        label="Avg Rating"    value={stats.avgRating}   color="blue"   />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendor, phone, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            onClick={() => setShowCatFilter((v) => !v)}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              categoryFilter !== 'all'
                ? 'border-orange-300 bg-orange-50 text-orange-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600',
            ].join(' ')}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {categoryFilter === 'all' ? 'Filter by Category' : categoryFilter}
          </button>
        </div>

        {/* Status chips */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                statusFilter === s
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600',
              ].join(' ')}
            >
              {s === 'all' ? 'All Statuses' : s}
            </button>
          ))}
        </div>

        {/* Category chips */}
        {showCatFilter && (
          <div className="flex gap-1 flex-wrap">
            {VENDOR_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  categoryFilter === c
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600',
                ].join(' ')}
              >
                {c === 'all' ? 'All Categories' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load vendors: {error.message}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <VendorSkeletonTable rows={6} />
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Vendor', 'Category', 'Contact', 'GST', 'Status', 'Rating', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">No vendors found.</td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr
                      key={v.id}
                      className="group border-b border-gray-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/vendors/${v.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex-shrink-0">
                            {(v.name || 'V')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{v.name || '—'}</p>
                            <p className="text-[11px] text-orange-500 font-mono">{v.vendorCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">
                          {v.category || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-gray-700">{v.phone || '—'}</p>
                        {v.email && <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{v.email}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-gray-500 font-mono">{v.gstNumber || '—'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <VendorStatusBadge status={v.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StarRating rating={v.rating} />
                      </td>
                      <td className="py-3.5 pl-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/vendors/${v.id}`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/vendors/${v.id}/edit`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(v)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
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

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {vendors.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
                No vendors found.
              </div>
            ) : (
              vendors.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
                  onClick={() => navigate(`/admin/vendors/${v.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{v.name || '—'}</p>
                      <p className="text-[11px] text-orange-500 font-mono">{v.vendorCode}</p>
                    </div>
                    <VendorStatusBadge status={v.status} />
                  </div>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">
                    {v.category || '—'}
                  </span>
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-600">{v.phone || '—'}</p>
                    <StarRating rating={v.rating} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500">{totalCount} vendor{totalCount !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => Math.abs(n - page) <= 2)
                  .map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={[
                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                        n === page
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-500',
                      ].join(' ')}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <VendorDeleteDialog
          vendor={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
