import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
  Calendar,
  ExternalLink,
  User,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  MessageSquare,
  Image,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import {
  subscribeToVerification,
  updateVerificationStatus,
  assignOfficer,
  addVerificationNote,
  appendVerificationFiles,
} from '../../services/verificationService.js';
import VerificationStatusBadge from '../../components/verification/VerificationStatusBadge.jsx';
import { SkeletonDetails } from '../../components/verification/VerificationSkeleton.jsx';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTimelineTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Reusable sub-components ────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800 flex-1">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false, href }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-0.5 text-sm text-blue-600 hover:underline break-all ${mono ? 'font-mono' : ''}`}
          >
            {value}
          </a>
        ) : (
          <p className={`mt-0.5 text-sm text-gray-700 break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

// ── Timeline Entry ─────────────────────────────────────────────────────────────

const TIMELINE_ICONS = {
  'Submitted':        { icon: ShieldCheck,  bg: 'bg-orange-100', color: 'text-orange-500' },
  'Pending':          { icon: Clock,        bg: 'bg-amber-100',  color: 'text-amber-500'  },
  'In Review':        { icon: ShieldCheck,  bg: 'bg-blue-100',   color: 'text-blue-500'   },
  'Approved':         { icon: CheckCircle2, bg: 'bg-emerald-100',color: 'text-emerald-500'},
  'Rejected':         { icon: XCircle,      bg: 'bg-red-100',    color: 'text-red-500'    },
  'Officer Assigned': { icon: UserCheck,    bg: 'bg-violet-100', color: 'text-violet-500' },
  'Note Added':       { icon: MessageSquare,bg: 'bg-gray-100',   color: 'text-gray-500'   },
  'Files Uploaded':   { icon: Upload,       bg: 'bg-teal-100',   color: 'text-teal-500'   },
};

function TimelineEntry({ entry, isLast }) {
  const cfg = TIMELINE_ICONS[entry.action] ?? TIMELINE_ICONS['Note Added'];
  const Icon = cfg.icon;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
        </div>
        {!isLast && <div className="flex-1 w-px bg-gray-100 my-1" />}
      </div>
      <div className={`pb-5 flex-1 min-w-0 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800">{entry.action}</p>
          <p className="text-[11px] text-gray-400 whitespace-nowrap">{formatTimelineTime(entry.timestamp)}</p>
        </div>
        {entry.note && (
          <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">{entry.note}</p>
        )}
        {entry.performedBy && (
          <p className="mt-1 text-[11px] text-gray-400">By {entry.performedBy}</p>
        )}
      </div>
    </div>
  );
}

// ── File Upload Zone ───────────────────────────────────────────────────────────

function FileUploadZone({ label, accept, multiple = true, files, onChange, icon: Icon = Upload }) {
  const inputRef = useRef(null);
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-6 px-4 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-200">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600">Click to browse</p>
          <p className="text-[11px] text-gray-400">{accept}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => onChange(Array.from(e.target.files))}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-700">
              <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{f.name}</span>
              <span className="ml-auto text-gray-400 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Status Action Panel ────────────────────────────────────────────────────────

function StatusActionPanel({ verification, onStatusChange, loading }) {
  const [note, setNote] = useState('');

  async function handle(newStatus) {
    await onStatusChange(newStatus, note);
    setNote('');
  }

  const isPending   = verification.status === 'Pending';
  const isInReview  = verification.status === 'In Review';
  const isApproved  = verification.status === 'Approved';
  const isRejected  = verification.status === 'Rejected';
  const isClosed    = isApproved || isRejected;

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note or reason for this action…"
        rows={2}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors resize-none"
      />
      <div className="flex flex-wrap gap-2">
        {!isInReview && !isClosed && (
          <button
            onClick={() => handle('In Review')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-60"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Mark In Review
          </button>
        )}
        {!isApproved && (
          <button
            onClick={() => handle('Approved')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </button>
        )}
        {!isRejected && (
          <button
            onClick={() => handle('Rejected')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
        )}
        {isClosed && (
          <button
            onClick={() => handle('Pending')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            <Clock className="h-3.5 w-3.5" />
            Reopen
          </button>
        )}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400 self-center" />}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VerificationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [verification, setVerification] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);

  // Action states
  const [statusLoading, setStatusLoading] = useState(false);
  const [officerName, setOfficerName]     = useState('');
  const [officerLoading, setOfficerLoading] = useState(false);
  const [noteText, setNoteText]           = useState('');
  const [noteLoading, setNoteLoading]     = useState(false);

  // File upload states
  const [imageFiles, setImageFiles]       = useState([]);
  const [docFiles, setDocFiles]           = useState([]);
  const [reportFile, setReportFile]       = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Real-time subscription
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToVerification(id, ({ data, error }) => {
      if (error) { setNotFound(true); setLoading(false); return; }
      if (!data)  { setNotFound(true); setLoading(false); return; }
      setVerification(data);
      setOfficerName(data.assignedOfficer ?? '');
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleStatusChange(newStatus, note) {
    setStatusLoading(true);
    try {
      await updateVerificationStatus(id, newStatus, note, 'Admin');
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      showToast(err.message ?? 'Failed to update status.', 'error');
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleAssignOfficer(e) {
    e.preventDefault();
    if (!officerName.trim()) return;
    setOfficerLoading(true);
    try {
      await assignOfficer(id, officerName.trim());
      showToast(`Assigned to ${officerName.trim()}`);
    } catch (err) {
      showToast(err.message ?? 'Failed to assign officer.', 'error');
    } finally {
      setOfficerLoading(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteLoading(true);
    try {
      await addVerificationNote(id, noteText.trim());
      setNoteText('');
      showToast('Note added to timeline');
    } catch (err) {
      showToast(err.message ?? 'Failed to add note.', 'error');
    } finally {
      setNoteLoading(false);
    }
  }

  async function handleUploadFiles(e) {
    e.preventDefault();
    if (!imageFiles.length && !docFiles.length && !reportFile) return;
    setUploadLoading(true);
    try {
      await appendVerificationFiles(id, imageFiles, docFiles, reportFile);
      setImageFiles([]);
      setDocFiles([]);
      setReportFile(null);
      showToast('Files uploaded successfully');
    } catch (err) {
      showToast(err.message ?? 'Failed to upload files.', 'error');
    } finally {
      setUploadLoading(false);
    }
  }

  // ── Loading / Not found ────────────────────────────────────────────────────

  if (loading) return <SkeletonDetails />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          <ShieldCheck className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">Verification not found</p>
        <p className="mt-1 text-xs text-gray-400">This record may have been deleted.</p>
        <button
          onClick={() => navigate('/admin/verification')}
          className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          Back to Verifications
        </button>
      </div>
    );
  }

  const v = verification;
  const timeline = [...(v.timeline ?? [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header nav */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate('/admin/verification')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-800">Verification Details</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Full record, timeline, and documents
          </p>
        </div>
        <VerificationStatusBadge status={v.status} size="lg" />
      </div>

      {/* Hero card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-orange-500 to-orange-600" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4 flex-wrap">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-amber-100 shadow-md">
              <Building2 className="h-7 w-7 text-amber-600" />
            </div>
            <div className="mb-1">
              <h2 className="text-lg font-bold text-gray-800">{v.propertyName || '—'}</h2>
              <p className="text-sm text-gray-500">{v.propertyAddress || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Type</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{v.propertyType || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Images</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{v.images?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Documents</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{v.documents?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Submitted</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{formatDate(v.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Property info */}
        <Section title="Property Information" icon={Building2}>
          <InfoRow icon={Building2} label="Property Name"    value={v.propertyName} />
          <InfoRow icon={MapPin}    label="Address"          value={v.propertyAddress} />
          <InfoRow icon={Building2} label="Property Type"    value={v.propertyType} />
          {!v.propertyName && !v.propertyAddress && (
            <p className="text-sm text-gray-400">No property information recorded.</p>
          )}
        </Section>

        {/* Owner info */}
        <Section title="Owner Information" icon={User}>
          <InfoRow icon={User}  label="Owner Name"    value={v.ownerName} />
          <InfoRow icon={Phone} label="Contact"       value={v.ownerContact} mono />
          <InfoRow icon={Mail}  label="Email"         value={v.ownerEmail}
            href={v.ownerEmail ? `mailto:${v.ownerEmail}` : undefined} />
          {!v.ownerName && !v.ownerContact && (
            <p className="text-sm text-gray-400">No owner information recorded.</p>
          )}
        </Section>

        {/* Officer assignment */}
        <Section title="Officer Assignment" icon={UserCheck}>
          <form onSubmit={handleAssignOfficer} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-gray-400 block mb-1.5">
                Assigned Officer
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Enter officer name…"
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                />
                <button
                  type="submit"
                  disabled={officerLoading || !officerName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  {officerLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                  Assign
                </button>
              </div>
            </div>
            {v.assignedOfficer && (
              <p className="text-xs text-gray-500">
                Currently assigned to{' '}
                <span className="font-semibold text-gray-700">{v.assignedOfficer}</span>
              </p>
            )}
          </form>
        </Section>

        {/* Status management */}
        <Section title="Verification Action" icon={ShieldCheck}>
          <StatusActionPanel
            verification={v}
            onStatusChange={handleStatusChange}
            loading={statusLoading}
          />
        </Section>
      </div>

      {/* Notes & Remarks */}
      <Section title="Notes & Remarks" icon={MessageSquare}>
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note or remark — it will appear in the timeline…"
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={noteLoading || !noteText.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {noteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
              Add Note
            </button>
          </div>
        </form>
      </Section>

      {/* File uploads */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Upload className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Upload Files</h3>
        </div>
        <form onSubmit={handleUploadFiles} className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FileUploadZone
              label="Property Images"
              accept=".jpg,.jpeg,.png,.webp"
              files={imageFiles}
              onChange={setImageFiles}
              icon={Image}
            />
            <FileUploadZone
              label="Supporting Documents"
              accept=".pdf,.doc,.docx,.xlsx"
              files={docFiles}
              onChange={setDocFiles}
              icon={FileText}
            />
            <FileUploadZone
              label="Verification Report"
              accept=".pdf"
              multiple={false}
              files={reportFile ? [reportFile] : []}
              onChange={(files) => setReportFile(files[0] ?? null)}
              icon={ShieldCheck}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploadLoading || (!imageFiles.length && !docFiles.length && !reportFile)}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {uploadLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                : <><Upload className="h-4 w-4" /> Upload Files</>}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded images */}
      {v.images && v.images.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <Image className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Property Images</h3>
            <span className="ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {v.images.length}
            </span>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {v.images.map((img, idx) => (
              <a
                key={idx}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl border border-gray-200 bg-gray-100 overflow-hidden hover:border-orange-200 transition-colors"
              >
                <img
                  src={img.url}
                  alt={img.name ?? `Image ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-medium text-white truncate">{img.name ?? `Image ${idx + 1}`}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {v.documents && v.documents.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <FileText className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Documents</h3>
            <span className="ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {v.documents.length}
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {v.documents.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40 transition-colors group"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
                  <FileText className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate group-hover:text-orange-700 transition-colors">
                    {doc.name || `Document ${idx + 1}`}
                  </p>
                  {doc.uploadedAt && (
                    <p className="text-[11px] text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-400 flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Verification Report */}
      {v.reportUrl && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-emerald-100 bg-emerald-50">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-emerald-800">Verification Report</h3>
          </div>
          <div className="p-5">
            <a
              href={v.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 hover:bg-emerald-50 transition-colors group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{v.reportName || 'Verification Report'}</p>
                <p className="text-[11px] text-gray-400">Click to open</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-emerald-500 ml-2 transition-colors" />
            </a>
          </div>
        </div>
      )}

      {/* Verification Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Clock className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Verification Timeline</h3>
          <span className="ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {timeline.length} events
          </span>
        </div>
        <div className="p-5">
          {timeline.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No timeline events recorded yet.</p>
          ) : (
            <div>
              {timeline.map((entry, idx) => (
                <TimelineEntry
                  key={entry.id ?? idx}
                  entry={entry}
                  isLast={idx === timeline.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record details */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Calendar className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Record Details</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Created At</p>
            <p className="mt-1 text-sm text-gray-700">{formatDateTime(v.createdAt)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Last Updated</p>
            <p className="mt-1 text-sm text-gray-700">{formatDateTime(v.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={[
            'fixed bottom-4 right-4 z-50 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium',
            toast.type === 'error'
              ? 'border-red-200 bg-white text-red-600'
              : 'border-emerald-200 bg-white text-emerald-700',
          ].join(' ')}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
