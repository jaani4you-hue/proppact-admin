import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Building2, FileText, Image as ImageIcon,
  ExternalLink, MessageSquareWarning, ClipboardList, Phone,
  Link2, Plus, Loader2, X, Wrench,
} from 'lucide-react';
import { subscribeToComplaintById, linkMaintenanceToComplaint } from '../../services/complaintService.js';
import { createMaintenanceRequest, generateMaintenanceNumber } from '../../services/maintenanceService.js';
import ComplaintStatusBadge from '../../components/complaints/ComplaintStatusBadge.jsx';
import ComplaintPriorityBadge from '../../components/complaints/ComplaintPriorityBadge.jsx';

function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

// ── Create Maintenance Modal ──────────────────────────────────────────────────
function CreateMaintenanceModal({ complaint, onClose, onCreated }) {
  const CATEGORIES = ['Plumbing', 'Electrical', 'Civil/Structural', 'Painting', 'Carpentry', 'HVAC', 'Pest Control', 'Cleaning', 'Lift/Elevator', 'Other'];
  const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];

  const [form, setForm] = useState({
    maintenanceNumber: generateMaintenanceNumber(),
    title            : complaint.title || '',
    category         : 'Plumbing',
    priority         : complaint.priority === 'Critical' ? 'Emergency' : complaint.priority || 'Medium',
    description      : complaint.description || '',
    propertyName     : complaint.propertyName || '',
    propertyId       : complaint.propertyId || '',
    propertyAddress  : complaint.propertyAddress || '',
    unitNumber       : complaint.unitNumber || '',
    complaintId      : complaint.id,
    complaintNumber  : complaint.complaintNumber,
    status           : 'Pending',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required.');
    setSaving(true);
    try {
      const maintenanceId = await createMaintenanceRequest(form, []);
      await linkMaintenanceToComplaint(complaint.id, maintenanceId, form.maintenanceNumber);
      onCreated(maintenanceId, form.maintenanceNumber);
    } catch (err) {
      setError(err.message || 'Failed to create maintenance request.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-4">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Create Maintenance Request</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800">
            This will create a maintenance work order linked to complaint <span className="font-mono font-semibold">{complaint.complaintNumber}</span> and mark it as "In Progress".
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Fix leaking pipe in Flat 4B"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
              {saving ? 'Creating…' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ComplaintDetails() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const [complaint, setComplaint]  = useState(null);
  const [loading,   setLoading]    = useState(true);
  const [activeTab, setActiveTab]  = useState('overview');
  const [showMntModal, setShowMntModal] = useState(false);

  useEffect(() => {
    const unsub = subscribeToComplaintById(id, ({ complaint: c }) => {
      setComplaint(c);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
    </div>
  );

  if (!complaint) return (
    <div className="py-20 text-center text-gray-400">
      <p className="text-lg font-semibold">Complaint not found.</p>
      <button onClick={() => navigate('/admin/complaints')} className="mt-3 text-sm text-orange-500 hover:underline">← Back to Complaints</button>
    </div>
  );

  const TABS = ['overview', 'attachments'];
  const canCreateMaintenance = !complaint.maintenanceId && !['Resolved', 'Closed', 'Rejected'].includes(complaint.status);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/admin/complaints')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{complaint.title || complaint.complaintNumber}</h1>
              <ComplaintStatusBadge status={complaint.status} />
              <ComplaintPriorityBadge priority={complaint.priority} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-orange-500 font-semibold">{complaint.complaintNumber}</span>
              <span className="text-gray-300">·</span>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">{complaint.category}</span>
              {complaint.maintenanceNumber && (
                <>
                  <span className="text-gray-300">·</span>
                  <button onClick={() => navigate(`/admin/maintenance/${complaint.maintenanceId}`)}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                    <Link2 className="h-3 w-3" />{complaint.maintenanceNumber}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {canCreateMaintenance && (
            <button onClick={() => setShowMntModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
              <Plus className="h-4 w-4" />Create Maintenance
            </button>
          )}
          <button onClick={() => navigate(`/admin/complaints/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors">
            <Pencil className="h-4 w-4" />Edit
          </button>
        </div>
      </div>

      {/* Linked maintenance banner */}
      {complaint.maintenanceId && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Maintenance request <span className="font-mono font-semibold">{complaint.maintenanceNumber}</span> has been raised for this complaint.
            </p>
          </div>
          <button onClick={() => navigate(`/admin/maintenance/${complaint.maintenanceId}`)}
            className="text-xs text-blue-600 hover:underline flex-shrink-0 ml-2">
            View →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={['px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'].join(' ')}>
            {t}
            {t === 'attachments' && complaint.attachments?.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold">{complaint.attachments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Complaint Info */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareWarning className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Complaint Info</h3>
            </div>
            <InfoRow label="Ref No."   value={complaint.complaintNumber} />
            <InfoRow label="Category"  value={complaint.category} />
            <InfoRow label="Priority"  value={complaint.priority} />
            <InfoRow label="Status"    value={complaint.status} />
            <InfoRow label="Filed On"  value={fmtDate(complaint.createdAt)} />
            {complaint.resolvedAt && <InfoRow label="Resolved" value={fmtDate(complaint.resolvedAt)} />}
            {complaint.description && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-600 leading-relaxed">{complaint.description}</p>
              </div>
            )}
          </div>

          {/* Complainant */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-green-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Complainant</h3>
            </div>
            {complaint.complainantName ? (
              <>
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex-shrink-0">
                    {complaint.complainantName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{complaint.complainantName}</p>
                    <span className="text-[11px] bg-gray-100 text-gray-600 rounded-md px-2 py-0.5 font-medium">{complaint.complainantType}</span>
                  </div>
                </div>
                {complaint.complainantPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />{complaint.complainantPhone}
                  </div>
                )}
                {complaint.complainantId && (
                  <button onClick={() => navigate(`/admin/${complaint.complainantType?.toLowerCase()}s/${complaint.complainantId}`)}
                    className="mt-2 text-xs text-orange-500 hover:underline">View Profile →</button>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">No complainant details.</p>
            )}
          </div>

          {/* Property */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-violet-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Property</h3>
            </div>
            <InfoRow label="Property" value={complaint.propertyName} />
            <InfoRow label="Unit"     value={complaint.unitNumber} />
            <InfoRow label="Address"  value={complaint.propertyAddress} />
            {complaint.propertyId && (
              <button onClick={() => navigate(`/admin/properties/${complaint.propertyId}`)}
                className="mt-2 text-xs text-orange-500 hover:underline">View Property →</button>
            )}
          </div>

          {/* Resolution */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Resolution</h3>
            </div>
            <InfoRow label="Created" value={fmtDate(complaint.createdAt)} />
            <InfoRow label="Updated" value={fmtDate(complaint.updatedAt)} />
            {complaint.maintenanceNumber && (
              <div className="mt-3">
                <button onClick={() => navigate(`/admin/maintenance/${complaint.maintenanceId}`)}
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline">
                  <Link2 className="h-3.5 w-3.5" />Maintenance: {complaint.maintenanceNumber}
                </button>
              </div>
            )}
            {complaint.resolutionNotes && (
              <div className="mt-3 rounded-lg bg-green-50 border border-green-100 p-3">
                <p className="text-[11px] font-semibold uppercase text-green-700 mb-1">Resolution Notes</p>
                <p className="text-xs text-gray-700 leading-relaxed">{complaint.resolutionNotes}</p>
              </div>
            )}
            {!complaint.resolutionNotes && (
              <p className="mt-3 text-xs text-gray-400 italic">No resolution notes yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Attachments */}
      {activeTab === 'attachments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Attachments ({complaint.attachments?.length ?? 0})</h3>
            <button onClick={() => navigate(`/admin/complaints/${id}/edit`)} className="text-xs text-orange-500 hover:underline">Upload more →</button>
          </div>
          {!complaint.attachments?.length ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">No files uploaded yet.</div>
          ) : (
            <div className="space-y-2">{complaint.attachments.map((f, i) => <FileRow key={i} file={f} />)}</div>
          )}
        </div>
      )}

      {showMntModal && (
        <CreateMaintenanceModal
          complaint={complaint}
          onClose={() => setShowMntModal(false)}
          onCreated={(mntId, mntNumber) => {
            setShowMntModal(false);
            navigate(`/admin/maintenance/${mntId}`);
          }}
        />
      )}
    </div>
  );
}
