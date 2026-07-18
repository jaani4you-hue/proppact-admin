import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  Building2, Home, CheckCircle2, Clock, HardHat, PauseCircle,
  LayoutGrid, Users2, TrendingUp, MapPin, FolderOpen,
} from 'lucide-react';
import { useProjects } from '../../hooks/useProjects.js';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge.jsx';
import ProjectTypeBadge from '../../components/projects/ProjectTypeBadge.jsx';
import { ProjectSkeletonTable } from '../../components/projects/ProjectSkeletonTable.jsx';
import ProjectDeleteDialog from '../../components/projects/ProjectDeleteDialog.jsx';

const STATUS_FILTERS = ['all', 'Upcoming', 'Under Construction', 'Ready to Move', 'Completed', 'On Hold'];
const TYPE_FILTERS   = ['all', 'Residential', 'Commercial', 'Mixed Use', 'Society', 'Township', 'Plotted Development'];

function fmt(n) {
  if (!n || n === 0) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}
function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ icon: Icon, label, value, sub, color = 'orange' }) {
  const colors = {
    orange : 'bg-orange-50  text-orange-500  border-orange-100',
    green  : 'bg-green-50   text-green-600   border-green-100',
    blue   : 'bg-blue-50    text-blue-600    border-blue-100',
    amber  : 'bg-amber-50   text-amber-600   border-amber-100',
    red    : 'bg-red-50     text-red-500     border-red-100',
    teal   : 'bg-teal-50    text-teal-600    border-teal-100',
    violet : 'bg-violet-50  text-violet-600  border-violet-100',
    gray   : 'bg-gray-50    text-gray-500    border-gray-100',
  };
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${colors[color] ?? colors.gray}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

function UnitBar({ available, sold, reserved, total }) {
  if (!total) return <span className="text-xs text-gray-400">—</span>;
  const avPct = Math.round((available / total) * 100);
  const sdPct = Math.round((sold      / total) * 100);
  const rsPct = Math.round((reserved  / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
        <div className="bg-green-400" style={{ width: `${avPct}%` }} />
        <div className="bg-red-400"   style={{ width: `${sdPct}%` }} />
        <div className="bg-amber-400" style={{ width: `${rsPct}%` }} />
      </div>
      <p className="text-[10px] text-gray-400">
        {available} avail · {sold} sold · {reserved} res.
      </p>
    </div>
  );
}

export default function ProjectList() {
  const navigate = useNavigate();
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [typeFilter,     setTypeFilter]     = useState('all');
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const { projects, loading, error, page, setPage, totalPages, totalCount, stats } =
    useProjects({ statusFilter, typeFilter, search });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects & Societies</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage residential &amp; commercial projects, societies, towers, floors and unit inventory
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/projects/new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard icon={Building2}   label="Total"          value={stats.total}         color="orange" />
        <StatCard icon={Clock}       label="Upcoming"        value={stats.upcoming}      color="blue"   />
        <StatCard icon={HardHat}     label="Under Constr."  value={stats.underConstr}   color="amber"  />
        <StatCard icon={CheckCircle2}label="Ready"          value={stats.ready}         color="green"  />
        <StatCard icon={TrendingUp}  label="Completed"      value={stats.completed}     color="teal"   />
        <StatCard icon={LayoutGrid}  label="Total Units"    value={stats.totalUnits}    color="violet" />
        <StatCard icon={Home}        label="Available"      value={stats.availableUnits}color="green"  />
        <StatCard icon={Users2}      label="Sold"           value={stats.soldUnits}     color="red"    />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search project, builder, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            onClick={() => setShowTypeFilter((v) => !v)}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              typeFilter !== 'all'
                ? 'border-orange-300 bg-orange-50 text-orange-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600',
            ].join(' ')}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {typeFilter === 'all' ? 'Filter by Type' : typeFilter}
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

        {/* Type chips */}
        {showTypeFilter && (
          <div className="flex gap-1 flex-wrap">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  typeFilter === t
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600',
                ].join(' ')}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load projects: {error.message}
        </div>
      )}

      {loading ? (
        <ProjectSkeletonTable rows={6} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Project', 'Type', 'Builder', 'Location', 'Unit Availability', 'Status', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr
                      key={p.id}
                      className="group border-b border-gray-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/projects/${p.id}`)}
                    >
                      {/* Project */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {p.images?.[0]?.url ? (
                            <img
                              src={p.images[0].url}
                              alt={p.projectName}
                              className="h-10 w-10 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                            />
                          ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold text-sm">
                              {(p.projectName || 'P')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800 text-sm leading-tight">{p.projectName || '—'}</p>
                            <p className="text-[11px] text-orange-500 font-mono">{p.projectCode}</p>
                            {p.rera && <p className="text-[10px] text-gray-400">RERA: {p.rera}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <ProjectTypeBadge type={p.projectType} showIcon />
                      </td>
                      {/* Builder */}
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-gray-700">{p.builderName || '—'}</p>
                        {p.builderPhone && <p className="text-[11px] text-gray-400">{p.builderPhone}</p>}
                      </td>
                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700">{p.city || '—'}</p>
                            {p.state && <p className="text-[11px] text-gray-400">{p.state}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Units */}
                      <td className="py-3.5 px-4">
                        <UnitBar
                          total={p.totalUnits}
                          available={p.availableUnits}
                          sold={p.soldUnits}
                          reserved={p.reservedUnits}
                        />
                      </td>
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <ProjectStatusBadge status={p.status} />
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/admin/projects/${p.id}`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => navigate(`/admin/projects/${p.id}/edit`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(p)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
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
            {projects.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
                No projects found.
              </div>
            ) : (
              projects.map((p) => (
                <div key={p.id}
                  className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/admin/projects/${p.id}`)}>
                  {/* Cover image strip */}
                  {p.images?.[0]?.url && (
                    <div className="h-28 w-full overflow-hidden">
                      <img src={p.images[0].url} alt={p.projectName} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.projectName}</p>
                        <p className="text-[11px] text-orange-500 font-mono">{p.projectCode}</p>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <ProjectTypeBadge type={p.projectType} showIcon />
                      {p.city && (
                        <span className="flex items-center gap-0.5 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />{p.city}
                        </span>
                      )}
                    </div>
                    <UnitBar total={p.totalUnits} available={p.availableUnits} sold={p.soldUnits} reserved={p.reservedUnits} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500">{totalCount} project{totalCount !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => Math.abs(n - page) <= 2)
                  .map((n) => (
                    <button key={n} onClick={() => setPage(n)}
                      className={['flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                        n === page ? 'bg-orange-500 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-500',
                      ].join(' ')}>
                      {n}
                    </button>
                  ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <ProjectDeleteDialog
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
