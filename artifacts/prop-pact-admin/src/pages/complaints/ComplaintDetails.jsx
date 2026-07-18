import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Building2, FileText, Image as ImageIcon,
  ExternalLink, MessageSquareWarning, ClipboardList, Phone,
  Link2, Plus, Loader2, X, Wrench, Clock, CheckCircle2,
  AlertTriangle, History, ChevronRight, IndianRupee,
} from 'lucide-react';
import {
  subscribeToComplaintById,
  linkMaintenanceToComplaint,
  setComplaintStatus,
} from '../../services/complaintService.js';
import { subscribeToComplaintHistory } from '../../services/complaintHistoryService.js';
import { createMaintenanceRequest, generateMaintenanceNumber, subscribeToMaintenanceRequestById } from '../../services/maintenanceService.js';
import ComplaintStatusBadge from '../../components/complaints/ComplaintStatusBadge.jsx';
import ComplaintPriorityBadge from '../../components/complaints/ComplaintPriorityBadge.jsx';
import WorkflowStepper from '../../components/complaints/WorkflowStepper.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMoney(v) {
  const n = Number(v);
  if (!n) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
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
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white border border-gray-200">
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

// ── History timeline ──────────────────────────────────────────────────────────

const HISTORY_ICON = {
  'Complaint filed'                        : MessageSquareWarning,
  'Sent for owner review'                  : Clock,
  'Work order created'                     : Wrench,
  'Maintenance work order raised'          : Wrench,
  'Vendor assigned'                        : CheckCircle2,
  'Work order / vendor assigned'           : Wrench,
  'Work order raised / vendor assigned'    : Wrench,
  'Auto-resolved — maintenance work completed': CheckCircle2,
  'Complaint resolved'                     : CheckCircle2,
  'Complaint closed'                       : CheckCircle2,
  'Complaint rejected'                     : AlertTriangle,
  'Status updated'                         : History,
};

const STATUS_COLOR = {
  Open           : 'text-red-500    bg-red-50',
  'Under Review' : 'text-yellow-600 bg-yellow-50',
  'In Progress'  : 'text-orange-500 bg-orange-50',
  Resolved       : 'text-green-600  bg-green-50',
  Closed         : 'text-gray-500   bg-gray-100',
  Rejected       : 'text-purple-600 bg-purple-50',
};

function HistoryTimeline({ history, loading }) {
  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
    </div>
  );
  if (!history.length) return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">
      No history recorded yet.
    </div>
  );
  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical rail */}
      <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gray-100" />

      {history.map((entry, idx) => {
        const Icon = HISTORY_ICON[entry.action] ?? History;
        const isFirst = idx === history.length - 1;
        return (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Dot */}
            <div className={[
              'absolute -left-3.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm flex-shrink-0',
              isFirst ? 'bg-gray-200' : 'bg-orange-100',
            ].join(' ')}>
              <Icon className={`h-3 w-3 ${isFirst ? 'text-gray-400' : 'text-orange-500'}`} />
            </div>

            {/* Card */}
            <div className="ml-1 flex-1 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{entry.action}</p>
                  {entry.note && (
                    <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{entry.note}</p>
                  )}
                  {/* Status transition pill */}
                  {entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[entry.fromStatus] ?? 'text-gray-500 bg-gray-100'}`}>
                        {entry.fromStatus}
                      </span>
                      <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[entry.toStatus] ?? 'text-gray-500 bg-gray-100'}`}>
                        {entry.toStatus}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-medium text-gray-500">{entry.date || '—'}</p>
                  <p className="text-[10px] text-gray-400">{entry.time || ''}</p>
                  <p className="text-[10px] text-orange-500 font-medium">{entry.changedBy || 'Admin'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Create Maintenance Modal ──────────────────────────────────────────────────
function CreateMaintenanceModal({ complaint, onClose, onCreated }) {
  const CATEGORIES = ['Plumbing', 'Electrical', 'Civil/Structural', 'Painting', 'Carpentry', 'HVAC', 'Pest Control', 'Cleaning', 'Lift/Elevator', 'Other'];
  const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];
  const VENDORS_PLACEHOLDER = 'Enter vendor name (assign later from Vendors module)';

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
    estimatedCost    : '',
    status           : 'Pending',
    scheduledDate    : '',
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
            <h3 className="font-semibold text-gray-900">Raise Work Order</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800">
            Creates a maintenance work order linked to&nbsp;
            <span className="font-mono font-semibold">{complaint.complaintNumber}</span>.
            Complaint will advance to <strong>In Progress</strong>.
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Fix leaking pipe in Flat 4B"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Estimated Cost (₹)</label>
              <input type="number" min="0" value={form.estimatedCost} onChange={(e) => set('estimatedCost', e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Scheduled Date</label>
              <input type="date" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
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
              {saving ? 'Creating…' : 'Raise Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Workflow Action Bar ───────────────────────────────────────────────────────

function WorkflowActions({ complaint, onAction }) {
  const [busy, setBusy] = useState(null);
  const status = complaint.status;

  async function doAction(newStatus, note = '') {
    setBusy(newStatus);
    try {
      await setComplaintStatus(complaint.id, newStatus, note);
      onAction && onAction(newStatus);
    } finally {
      setBusy(null);
    }
  }

  const Btn = ({ label, icon: Icon, onClick, color = 'orange', disabled = false }) => (
    <button onClick={onClick} disabled={disabled || busy !== null}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
        color === 'orange' ? 'bg-orange-500 text-white hover:bg-orange-600' :
        color === 'yellow' ? 'border border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' :
        color === 'green'  ? 'border border-green-300 bg-green-50 text-green-700 hover:bg-green-100' :
        color === 'gray'   ? 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50' : '',
      ].join(' ')}>
      {busy === label ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'Open' && (
        <Btn label="Under Review" icon={Clock} color="yellow"
          onClick={() => doAction('Under Review', 'Sent to owner for review')} />
      )}
      {(status === 'Open' || status === 'Under Review') && (
        <Btn label="In Progress" icon={Wrench} color="orange"
          onClick={() => doAction('In Progress')} />
      )}
      {status === 'In Progress' && (
        <Btn label="Resolve" icon={CheckCircle2} color="green"
          onClick={() => doAction('Resolved', 'Marked resolved by admin')} />
      )}
      {status === 'Resolved' && (
        <Btn label="Close" icon={CheckCircle2} color="gray"
          onClick={() => doAction('Closed')} />
      )}
      {!['Resolved', 'Closed', 'Rejected'].includes(status) && (
        <Btn label="Reject" icon={AlertTriangle} color="gray"
          onClick={() => doAction('Rejected')} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComplaintDetails() {
  const navigate   = useNavigate();
  const { id }     = useParams();

  const [complaint,      setComplaint]      = useState(null);
  const [request,        setRequest]        = useState(null);
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('overview');
  const [showMntModal,   setShowMntModal]   = useState(false);

  // Live complaint
  useEffect(() => {
    const unsub = subscribeToComplaintById(id, ({ complaint: c }) => {
      setComplaint(c);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  // Live linked maintenance request
  useEffect(() => {
    if (!complaint?.maintenanceId) { setRequest(null); return; }
    return subscribeToMaintenanceRequestById(complaint.maintenanceId, ({ request: r }) => {
      setRequest(r);
    });
  }, [complaint?.maintenanceId]);

  // Live history
  useEffect(() => {
    setHistoryLoading(true);
    const unsub = subscribeToComplaintHistory(id, ({ history: h }) => {
      setHistory(h);
      setHistoryLoading(false);
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
      <button onClick={() => navigate('/admin/complaints')} className="mt-3 text-sm text-orange-500 hover:underline">← Back</button>
    </div>
  );

  const canCreateMaintenance = !complaint.maintenanceId && !['Resolved', 'Closed', 'Rejected'].includes(complaint.status);
  const TABS = [
    { key: 'overview',    label: 'Overview' },
    { key: 'attachments', label: 'Attachments', count: complaint.attachments?.length ?? 0 },
    { key: 'history',     label: 'History',     count: history.length },
  ];

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
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          {canCreateMaintenance && (
            <button onClick={() => setShowMntModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
              <Plus className="h-4 w-4" />Raise Work Order
            </button>
          )}
          <button onClick={() => navigate(`/admin/complaints/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors">
            <Pencil className="h-4 w-4" />Edit
          </button>
        </div>
      </div>

      {/* Workflow Stepper */}
      <WorkflowStepper complaint={complaint} request={request} />

      {/* Quick workflow actions */}
      {!['Resolved', 'Closed', 'Rejected'].includes(complaint.status) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Advance:</span>
          <WorkflowActions complaint={complaint} />
        </div>
      )}

      {/* Linked maintenance banner */}
      {complaint.maintenanceId && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Work Order: <span className="font-mono">{complaint.maintenanceNumber}</span>
                </p>
                {request && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    Status: <strong>{request.status}</strong>
                    {request.assignedVendorName ? ` · ${request.assignedVendorName}` : ''}
                    {request.scheduledDate ? ` · Scheduled ${request.scheduledDate}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {request && (
                <div className="text-right text-xs text-blue-700">
                  {Number(request.estimatedCost) > 0 && (
                    <p>Est. {fmtMoney(request.estimatedCost)}</p>
                  )}
                  {Number(request.actualCost) > 0 && (
                    <p className="font-semibold">Actual {fmtMoney(request.actualCost)}</p>
                  )}
                </div>
              )}
              <button onClick={() => navigate(`/admin/maintenance/${complaint.maintenanceId}`)}
                className="text-xs font-semibold text-blue-600 hover:underline flex-shrink-0">
                View →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={['px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex items-center gap-1.5',
              activeTab === t.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'].join(' ')}>
            {t.label}
            {t.count > 0 && (
              <span className="rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Complainant (Tenant / Owner)</h3>
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
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />{complaint.complainantPhone}
                  </div>
                )}
                {complaint.complainantId && (
                  <button
                    onClick={() => navigate(`/admin/${(complaint.complainantType || 'tenant').toLowerCase()}s/${complaint.complainantId}`)}
                    className="mt-1 text-xs text-orange-500 hover:underline">
                    View Profile →
                  </button>
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

          {/* Cost & Resolution */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-4 w-4 text-gray-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cost & Resolution</h3>
            </div>
            {request ? (
              <>
                <InfoRow label="Vendor"        value={request.assignedVendorName} />
                <InfoRow label="Estimated Cost" value={fmtMoney(request.estimatedCost)} />
                <InfoRow label="Actual Cost"    value={fmtMoney(request.actualCost)} />
                <InfoRow label="Work Status"    value={request.status} />
                {request.scheduledDate && <InfoRow label="Scheduled" value={request.scheduledDate} />}
                {request.completedDate && <InfoRow label="Completed"  value={request.completedDate} />}
              </>
            ) : (
              <>
                <InfoRow label="Created" value={fmtDate(complaint.createdAt)} />
                <InfoRow label="Updated" value={fmtDate(complaint.updatedAt)} />
                <p className="mt-3 text-xs text-gray-400 italic">
                  {complaint.maintenanceId ? 'Loading cost details…' : 'No work order raised yet.'}
                </p>
              </>
            )}
            {complaint.resolutionNotes && (
              <div className="mt-3 rounded-lg bg-green-50 border border-green-100 p-3">
                <p className="text-[11px] font-semibold uppercase text-green-700 mb-1">Resolution Notes</p>
                <p className="text-xs text-gray-700 leading-relaxed">{complaint.resolutionNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Attachments ── */}
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

      {/* ── History ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Audit Trail</h3>
            <p className="text-xs text-gray-400">All status changes and actions — newest first</p>
          </div>
          <HistoryTimeline history={history} loading={historyLoading} />
        </div>
      )}

      {showMntModal && (
        <CreateMaintenanceModal
          complaint={complaint}
          onClose={() => setShowMntModal(false)}
          onCreated={(mntId) => {
            setShowMntModal(false);
            navigate(`/admin/maintenance/${mntId}`);
          }}
        />
      )}
    </div>
  );
}
