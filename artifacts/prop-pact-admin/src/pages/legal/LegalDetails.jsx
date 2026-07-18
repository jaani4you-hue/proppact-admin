import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Plus, X, Calendar, User, Building2,
  FileText, Image as ImageIcon, ExternalLink, Scale,
  CheckCircle2, Clock, AlertCircle, Phone, Mail,
  Gavel, IndianRupee, ClipboardList, Loader2,
} from 'lucide-react';
import {
  subscribeToLegalCaseById,
  subscribeToHearings,
  addHearing,
  deleteHearing,
} from '../../services/legalService.js';
import LegalStatusBadge from '../../components/legal/LegalStatusBadge.jsx';
import LegalCaseTypeBadge from '../../components/legal/LegalCaseTypeBadge.jsx';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(v) {
  if (!v?.toDate) return '';
  return v.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${highlight ? 'text-orange-600' : 'text-gray-800'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function StatPill({ label, value, color = 'gray' }) {
  const cols = {
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    green : 'bg-green-50  text-green-700  border-green-100',
    red   : 'bg-red-50    text-red-700    border-red-100',
    blue  : 'bg-blue-50   text-blue-700   border-blue-100',
    gray  : 'bg-gray-50   text-gray-700   border-gray-100',
  };
  return (
    <div className={`flex flex-col items-center rounded-xl border px-4 py-3 ${cols[color]}`}>
      <span className="text-[11px] uppercase font-medium opacity-70 mb-0.5">{label}</span>
      <span className="text-base font-bold">{value}</span>
    </div>
  );
}

// ── Add Hearing Modal ─────────────────────────────────────────────────────────
function HearingModal({ caseId, legalCase, onClose }) {
  const [form, setForm] = useState({
    date           : '',
    time           : '',
    courtName      : legalCase?.courtName      || '',
    judgeAssigned  : legalCase?.judgeAssigned  || '',
    advocateName   : legalCase?.advocateName   || '',
    purpose        : '',
    outcome        : '',
    nextHearingDate: '',
    notes          : '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date) return setError('Hearing date is required.');
    setSaving(true);
    try {
      await addHearing(caseId, form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add hearing.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-4">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Add Hearing</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Time</label>
              <input
                type="time" value={form.time} onChange={(e) => set('time', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Court</label>
              <input
                value={form.courtName} onChange={(e) => set('courtName', e.target.value)}
                placeholder="Court name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Judge</label>
              <input
                value={form.judgeAssigned} onChange={(e) => set('judgeAssigned', e.target.value)}
                placeholder="Judge name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Purpose</label>
            <input
              value={form.purpose} onChange={(e) => set('purpose', e.target.value)}
              placeholder="e.g. Arguments, Evidence submission, Judgment"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Outcome</label>
            <input
              value={form.outcome} onChange={(e) => set('outcome', e.target.value)}
              placeholder="e.g. Adjourned, In favour, Part-heard"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Next Hearing Date
            </label>
            <input
              type="date" value={form.nextHearingDate} onChange={(e) => set('nextHearingDate', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea
              rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Additional remarks…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Add Hearing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── File preview row ──────────────────────────────────────────────────────────
function FileRow({ file }) {
  const isPDF   = file.type === 'application/pdf' || file.name?.endsWith('.pdf');
  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white border border-gray-200 text-gray-500">
        {isImage ? <ImageIcon className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-orange-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
        {file.uploadedAt && (
          <p className="text-[10px] text-gray-400">{fmtDate(file.uploadedAt)}</p>
        )}
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors flex-shrink-0"
      >
        {isPDF ? 'Preview' : 'Open'}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

// ── Timeline item ─────────────────────────────────────────────────────────────
function TimelineItem({ hearing, onDelete, isLast }) {
  const isPast = hearing.date < new Date().toISOString().slice(0, 10);
  return (
    <div className="relative flex gap-4">
      {/* Line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-100" />
      )}
      {/* Dot */}
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 z-10 ${
        isPast
          ? hearing.outcome
            ? 'border-green-300 bg-green-50 text-green-600'
            : 'border-gray-200 bg-gray-50 text-gray-400'
          : 'border-orange-300 bg-orange-50 text-orange-500'
      }`}>
        <Gavel className="h-3.5 w-3.5" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {fmtDate(hearing.date)}
              {hearing.time && <span className="ml-1.5 text-xs font-normal text-gray-400">{hearing.time}</span>}
            </p>
            {hearing.purpose && (
              <p className="text-xs text-gray-500 mt-0.5">{hearing.purpose}</p>
            )}
          </div>
          <button
            onClick={() => onDelete(hearing.id)}
            className="text-gray-300 hover:text-red-400 transition-colors mt-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5 space-y-1.5">
          {hearing.courtName && (
            <p className="text-xs text-gray-600"><span className="font-medium">Court:</span> {hearing.courtName}</p>
          )}
          {hearing.judgeAssigned && (
            <p className="text-xs text-gray-600"><span className="font-medium">Judge:</span> {hearing.judgeAssigned}</p>
          )}
          {hearing.outcome && (
            <p className="text-xs">
              <span className="font-medium text-gray-600">Outcome: </span>
              <span className="text-green-700">{hearing.outcome}</span>
            </p>
          )}
          {hearing.nextHearingDate && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Next: </span>{fmtDate(hearing.nextHearingDate)}
            </p>
          )}
          {hearing.notes && (
            <p className="text-xs text-gray-500 italic">"{hearing.notes}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LegalDetails() {
  const navigate     = useNavigate();
  const { id }       = useParams();
  const [lc,         setLc]         = useState(null);
  const [hearings,   setHearings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [showHearing, setShowHearing] = useState(false);

  useEffect(() => {
    const u1 = subscribeToLegalCaseById(id, ({ legalCase }) => {
      setLc(legalCase);
      setLoading(false);
    });
    const u2 = subscribeToHearings(id, ({ hearings: h }) => setHearings(h));
    return () => { u1(); u2(); };
  }, [id]);

  async function handleDeleteHearing(hearingId) {
    if (!confirm('Remove this hearing record?')) return;
    await deleteHearing(hearingId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }
  if (!lc) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-lg font-semibold">Legal case not found.</p>
        <button onClick={() => navigate('/admin/legal')} className="mt-3 text-sm text-orange-500 hover:underline">
          ← Back to Legal Cases
        </button>
      </div>
    );
  }

  const TABS = ['overview', 'hearings', 'documents', 'evidence'];

  const today = new Date().toISOString().slice(0, 10);
  const isHearingSoon = lc.nextHearingDate && lc.nextHearingDate >= today
    && lc.nextHearingDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/admin/legal')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{lc.title || lc.caseNumber}</h1>
              <LegalStatusBadge status={lc.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-orange-500 font-semibold">{lc.caseNumber}</span>
              <span className="text-gray-300">·</span>
              <LegalCaseTypeBadge type={lc.caseType} showIcon />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowHearing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Hearing
          </button>
          <button
            onClick={() => navigate(`/admin/legal/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Upcoming hearing alert */}
      {isHearingSoon && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <Calendar className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-semibold">Hearing soon</span> — Next hearing on{' '}
            <span className="font-bold">{fmtDate(lc.nextHearingDate)}</span>
            {lc.courtName && ` at ${lc.courtName}`}.
          </p>
        </div>
      )}

      {/* Stat pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Claim"    value={fmt(lc.claimAmount)}   color="orange" />
        <StatPill label="Settled"  value={fmt(lc.settledAmount)} color="green"  />
        <StatPill label="Fees"     value={fmt(lc.legalFees)}     color="blue"   />
        <StatPill label="Hearings" value={hearings.length}       color="gray"   />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={[
              'px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === t
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            {t}
            {t === 'hearings'  && hearings.length > 0     && <span className="ml-1.5 rounded-full bg-orange-100 text-orange-600 px-1.5 py-0.5 text-[10px] font-bold">{hearings.length}</span>}
            {t === 'documents' && lc.documents?.length > 0 && <span className="ml-1.5 rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold">{lc.documents.length}</span>}
            {t === 'evidence'  && lc.evidence?.length > 0  && <span className="ml-1.5 rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold">{lc.evidence.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Case Info */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Case Information</h3>
            </div>
            <InfoRow label="Case No."      value={lc.caseNumber} highlight />
            <InfoRow label="Type"          value={lc.caseType} />
            <InfoRow label="Status"        value={lc.status} />
            <InfoRow label="Filing Date"   value={fmtDate(lc.filingDate)} />
            <InfoRow label="Next Hearing"  value={fmtDate(lc.nextHearingDate)} />
            <InfoRow label="Closing Date"  value={fmtDate(lc.closingDate)} />
            {lc.description && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-600 leading-relaxed">{lc.description}</p>
              </div>
            )}
          </div>

          {/* Advocate */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-blue-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Advocate</h3>
            </div>
            {lc.advocateName ? (
              <>
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex-shrink-0">
                    {lc.advocateName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{lc.advocateName}</p>
                    {lc.advocateBarNo && <p className="text-xs text-gray-400">{lc.advocateBarNo}</p>}
                  </div>
                </div>
                {lc.advocatePhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {lc.advocatePhone}
                  </div>
                )}
                {lc.advocateEmail && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {lc.advocateEmail}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">No advocate assigned.</p>
            )}
          </div>

          {/* Client */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-green-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Client</h3>
            </div>
            {lc.clientName ? (
              <>
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-sm flex-shrink-0">
                    {lc.clientName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{lc.clientName}</p>
                    {lc.clientType && (
                      <span className="text-[11px] bg-gray-100 text-gray-600 rounded-md px-2 py-0.5 font-medium">{lc.clientType}</span>
                    )}
                  </div>
                </div>
                {lc.clientPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {lc.clientPhone}
                  </div>
                )}
                {lc.clientId && (
                  <button
                    onClick={() => navigate(`/admin/${lc.clientType?.toLowerCase()}s/${lc.clientId}`)}
                    className="mt-2 text-xs text-orange-500 hover:underline"
                  >
                    View Profile →
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">No client assigned.</p>
            )}
          </div>

          {/* Property & Court */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-violet-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Property & Court</h3>
            </div>
            <InfoRow label="Property"  value={lc.propertyName} />
            <InfoRow label="Address"   value={lc.propertyAddress} />
            {lc.propertyId && (
              <button
                onClick={() => navigate(`/admin/properties/${lc.propertyId}`)}
                className="text-xs text-orange-500 hover:underline mb-2 block"
              >
                View Property →
              </button>
            )}
            <div className="mt-3 pt-3 border-t border-gray-50">
              <InfoRow label="Court"   value={lc.courtName} />
              <InfoRow label="Location" value={lc.courtLocation} />
              <InfoRow label="Judge"   value={lc.judgeAssigned} />
            </div>
          </div>

          {/* Financial */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Financials</h3>
            </div>
            <InfoRow label="Claim Amount"   value={fmt(lc.claimAmount)} />
            <InfoRow label="Settled Amount" value={fmt(lc.settledAmount)} />
            <InfoRow label="Legal Fees"     value={fmt(lc.legalFees)} />
          </div>

          {/* Timestamps + Notes */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Record</h3>
            </div>
            <InfoRow label="Created" value={fmtDate(lc.createdAt)} />
            <InfoRow label="Updated" value={fmtDate(lc.updatedAt)} />
            {lc.notes && (
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-[11px] font-semibold uppercase text-amber-600 mb-1">Notes</p>
                <p className="text-xs text-gray-700 leading-relaxed">{lc.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hearings Timeline ── */}
      {activeTab === 'hearings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">
              Hearing Timeline ({hearings.length})
            </h3>
            <button
              onClick={() => setShowHearing(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Hearing
            </button>
          </div>
          {hearings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">
              No hearings recorded yet.
            </div>
          ) : (
            <div className="pl-2">
              {hearings.map((h, i) => (
                <TimelineItem
                  key={h.id}
                  hearing={h}
                  onDelete={handleDeleteHearing}
                  isLast={i === hearings.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Documents ── */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Case Documents ({lc.documents?.length ?? 0})
            </h3>
            <button
              onClick={() => navigate(`/admin/legal/${id}/edit`)}
              className="text-xs text-orange-500 hover:underline"
            >
              Upload more →
            </button>
          </div>
          {!lc.documents?.length ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {lc.documents.map((f, i) => <FileRow key={i} file={f} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Evidence ── */}
      {activeTab === 'evidence' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Evidence ({lc.evidence?.length ?? 0})
            </h3>
            <button
              onClick={() => navigate(`/admin/legal/${id}/edit`)}
              className="text-xs text-orange-500 hover:underline"
            >
              Upload more →
            </button>
          </div>
          {!lc.evidence?.length ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">
              No evidence uploaded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {lc.evidence.map((f, i) => <FileRow key={i} file={f} />)}
            </div>
          )}
        </div>
      )}

      {/* Hearing modal */}
      {showHearing && (
        <HearingModal
          caseId={id}
          legalCase={lc}
          onClose={() => setShowHearing(false)}
        />
      )}
    </div>
  );
}
