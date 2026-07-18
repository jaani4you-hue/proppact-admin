import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Building2, FileText, Image as ImageIcon,
  ExternalLink, Wrench, IndianRupee, ClipboardList, Calendar,
  HardHat, Link2,
} from 'lucide-react';
import { subscribeToMaintenanceRequestById } from '../../services/maintenanceService.js';
import MaintenanceStatusBadge from '../../components/maintenance/MaintenanceStatusBadge.jsx';
import MaintenancePriorityBadge from '../../components/maintenance/MaintenancePriorityBadge.jsx';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (typeof v === 'string' && v.length === 10) return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-medium text-right text-gray-800">{value || '—'}</span>
    </div>
  );
}

function FileRow({ file }) {
  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white border border-gray-200 text-gray-500">
        {isImage ? <ImageIcon className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-orange-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
        {file.uploadedAt && <p className="text-[10px] text-gray-400">{fmtDate(file.uploadedAt)}</p>}
      </div>
      <a href={file.url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors flex-shrink-0">
        Open <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

export default function MaintenanceDetails() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const [req,     setReq]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const unsub = subscribeToMaintenanceRequestById(id, ({ request: r }) => {
      setReq(r);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
    </div>
  );

  if (!req) return (
    <div className="py-20 text-center text-gray-400">
      <p className="text-lg font-semibold">Maintenance request not found.</p>
      <button onClick={() => navigate('/admin/maintenance')} className="mt-3 text-sm text-orange-500 hover:underline">← Back to Maintenance</button>
    </div>
  );

  const TABS = ['overview', 'attachments'];
  const costVariance = (Number(req.actualCost) || 0) - (Number(req.estimatedCost) || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/admin/maintenance')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{req.title || req.maintenanceNumber}</h1>
              <MaintenanceStatusBadge status={req.status} />
              <MaintenancePriorityBadge priority={req.priority} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-orange-500 font-semibold">{req.maintenanceNumber}</span>
              <span className="text-gray-300">·</span>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">{req.category}</span>
              {req.complaintNumber && (
                <>
                  <span className="text-gray-300">·</span>
                  <button onClick={() => navigate(`/admin/complaints/${req.complaintId}`)}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                    <Link2 className="h-3 w-3" />{req.complaintNumber}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => navigate(`/admin/maintenance/${id}/edit`)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors flex-shrink-0">
          <Pencil className="h-4 w-4" />Edit
        </button>
      </div>

      {/* Cost pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Estimated', value: fmt(req.estimatedCost), color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Actual',    value: fmt(req.actualCost),    color: 'bg-orange-50 text-orange-700 border-orange-100' },
          { label: 'Variance',  value: (costVariance >= 0 ? '+' : '') + fmt(Math.abs(costVariance)), color: costVariance > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Files',     value: req.attachments?.length ?? 0, color: 'bg-gray-50 text-gray-700 border-gray-100' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`flex flex-col items-center rounded-xl border px-4 py-3 ${color}`}>
            <span className="text-[11px] uppercase font-medium opacity-70 mb-0.5">{label}</span>
            <span className="text-base font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={['px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'].join(' ')}>
            {t}
            {t === 'attachments' && req.attachments?.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold">{req.attachments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Request Info */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Request Info</h3>
            </div>
            <InfoRow label="Ref No."  value={req.maintenanceNumber} />
            <InfoRow label="Category" value={req.category} />
            <InfoRow label="Priority" value={req.priority} />
            <InfoRow label="Status"   value={req.status} />
            {req.description && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-600 leading-relaxed">{req.description}</p>
              </div>
            )}
          </div>

          {/* Property */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-violet-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Property</h3>
            </div>
            <InfoRow label="Property" value={req.propertyName} />
            <InfoRow label="Unit"     value={req.unitNumber} />
            <InfoRow label="Address"  value={req.propertyAddress} />
            {req.propertyId && (
              <button onClick={() => navigate(`/admin/properties/${req.propertyId}`)}
                className="mt-2 text-xs text-orange-500 hover:underline">View Property →</button>
            )}
          </div>

          {/* Vendor */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HardHat className="h-4 w-4 text-blue-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Vendor</h3>
            </div>
            {req.assignedVendorName ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex-shrink-0">
                    {req.assignedVendorName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{req.assignedVendorName}</p>
                    {req.assignedVendorPhone && <p className="text-xs text-gray-400">{req.assignedVendorPhone}</p>}
                  </div>
                </div>
                {req.assignedVendorId && (
                  <button onClick={() => navigate(`/admin/vendors/${req.assignedVendorId}`)}
                    className="text-xs text-orange-500 hover:underline">View Vendor →</button>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">No vendor assigned.</p>
            )}
          </div>

          {/* Schedule & Cost */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-green-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Schedule & Cost</h3>
            </div>
            <InfoRow label="Scheduled"  value={fmtDate(req.scheduledDate)} />
            <InfoRow label="Completed"  value={fmtDate(req.completedDate)} />
            <div className="mt-3 pt-3 border-t border-gray-50">
              <InfoRow label="Estimated"  value={fmt(req.estimatedCost)} />
              <InfoRow label="Actual"     value={fmt(req.actualCost)} />
            </div>
          </div>

          {/* Record */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Record</h3>
            </div>
            <InfoRow label="Created" value={fmtDate(req.createdAt)} />
            <InfoRow label="Updated" value={fmtDate(req.updatedAt)} />
            {req.complaintNumber && (
              <div className="mt-3">
                <button onClick={() => navigate(`/admin/complaints/${req.complaintId}`)}
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline">
                  <Link2 className="h-3.5 w-3.5" />View linked complaint {req.complaintNumber}
                </button>
              </div>
            )}
            {req.notes && (
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-[11px] font-semibold uppercase text-amber-600 mb-1">Notes</p>
                <p className="text-xs text-gray-700 leading-relaxed">{req.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachments */}
      {activeTab === 'attachments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Attachments ({req.attachments?.length ?? 0})</h3>
            <button onClick={() => navigate(`/admin/maintenance/${id}/edit`)} className="text-xs text-orange-500 hover:underline">Upload more →</button>
          </div>
          {!req.attachments?.length ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">No files uploaded yet.</div>
          ) : (
            <div className="space-y-2">{req.attachments.map((f, i) => <FileRow key={i} file={f} />)}</div>
          )}
        </div>
      )}
    </div>
  );
}
