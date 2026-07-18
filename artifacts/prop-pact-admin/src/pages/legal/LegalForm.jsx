import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, Upload, X, FileText, Image as ImageIcon,
} from 'lucide-react';
import {
  createLegalCase,
  updateLegalCase,
  getLegalCaseById,
  generateCaseNumber,
} from '../../services/legalService.js';

const CASE_TYPES   = ['Legal Notice', 'Rent Agreement', 'Eviction', 'Court Case', 'Other'];
const STATUSES     = ['Pending', 'Active', 'Won', 'Lost', 'Closed', 'Withdrawn', 'On Hold'];
const CLIENT_TYPES = ['Tenant', 'Owner', 'Dealer', 'Other'];

const EMPTY = {
  caseNumber      : '',
  caseType        : 'Legal Notice',
  title           : '',
  status          : 'Pending',
  description     : '',
  // Advocate
  advocateName    : '',
  advocatePhone   : '',
  advocateEmail   : '',
  advocateBarNo   : '',
  // Client
  clientName      : '',
  clientId        : '',
  clientType      : 'Tenant',
  clientPhone     : '',
  // Property
  propertyName    : '',
  propertyId      : '',
  propertyAddress : '',
  // Court
  courtName       : '',
  courtLocation   : '',
  judgeAssigned   : '',
  // Dates
  filingDate      : '',
  nextHearingDate : '',
  closingDate     : '',
  // Financial
  claimAmount     : '',
  settledAmount   : '',
  legalFees       : '',
  // Docs / evidence tracked separately via files
  documents       : [],
  evidence        : [],
  notes           : '',
};

function SectionTitle({ n, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
        {n}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${className}`}
      {...props}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      {...props}
    >
      {children}
    </select>
  );
}

function FileDropZone({ label, accept, multiple = true, files, onChange, existingFiles = [], onRemoveExisting }) {
  const inputRef = useRef();

  function handleDrop(e) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onChange(multiple ? [...files, ...dropped] : dropped.slice(0, 1));
  }

  function handleChange(e) {
    const picked = Array.from(e.target.files);
    onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
    e.target.value = '';
  }

  function remove(idx) {
    onChange(files.filter((_, i) => i !== idx));
  }

  function fileIcon(f) {
    if (f.type?.startsWith('image/')) return <ImageIcon className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center transition-colors hover:border-orange-300 hover:bg-orange-50/30"
      >
        <Upload className="mb-2 h-5 w-5 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400">
          Drag & drop or click to browse
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* Existing uploaded files */}
      {existingFiles.length > 0 && (
        <div className="space-y-1.5">
          {existingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2">
              <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs text-blue-600 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {f.name}
              </a>
              <span className="text-[10px] text-gray-400">Saved</span>
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveExisting(i); }}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Newly selected files */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
              <span className="text-gray-500">{fileIcon(f)}</span>
              <span className="flex-1 text-xs text-gray-700 truncate">{f.name}</span>
              <span className="text-[10px] text-gray-400">
                {f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LegalForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [form,       setForm]       = useState({ ...EMPTY, caseNumber: generateCaseNumber() });
  const [docFiles,   setDocFiles]   = useState([]);
  const [evFiles,    setEvFiles]    = useState([]);
  const [loading,    setLoading]    = useState(isEdit);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getLegalCaseById(id).then((c) => {
      if (c) {
        setForm({
          ...EMPTY,
          ...c,
          claimAmount  : String(c.claimAmount   ?? ''),
          settledAmount: String(c.settledAmount ?? ''),
          legalFees    : String(c.legalFees     ?? ''),
        });
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function removeDoc(idx) {
    setForm((f) => ({ ...f, documents: f.documents.filter((_, i) => i !== idx) }));
  }
  function removeEvidence(idx) {
    setForm((f) => ({ ...f, evidence: f.evidence.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim())    return setError('Case title is required.');
    if (!form.caseType)        return setError('Case type is required.');

    const data = {
      ...form,
      claimAmount  : Number(form.claimAmount)   || 0,
      settledAmount: Number(form.settledAmount) || 0,
      legalFees    : Number(form.legalFees)     || 0,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateLegalCase(id, data, docFiles, evFiles);
        navigate(`/admin/legal/${id}`);
      } else {
        const newId = await createLegalCase(data, docFiles, evFiles);
        navigate(`/admin/legal/${newId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Legal Case' : 'New Legal Case'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit ? 'Update case details and documents.' : 'Create a new legal case record.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── 1. Case Identity ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={1} title="Case Identity" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Case Number">
              <Input
                value={form.caseNumber}
                onChange={(e) => set('caseNumber', e.target.value)}
                placeholder="Auto-generated"
              />
            </Field>
            <Field label="Case Type" required>
              <Select value={form.caseType} onChange={(e) => set('caseType', e.target.value)}>
                {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Case Title" required className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Eviction — Flat 4B, Sunrise Apts"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={3}
              placeholder="Brief description of the legal matter…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </Field>
        </div>

        {/* ── 2. Advocate ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={2} title="Advocate Assignment" desc="Assigned legal counsel" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Advocate Name">
              <Input value={form.advocateName} onChange={(e) => set('advocateName', e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Bar Registration No.">
              <Input value={form.advocateBarNo} onChange={(e) => set('advocateBarNo', e.target.value)} placeholder="e.g. MH/12345/2018" />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={form.advocatePhone} onChange={(e) => set('advocatePhone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.advocateEmail} onChange={(e) => set('advocateEmail', e.target.value)} placeholder="advocate@firm.com" />
            </Field>
          </div>
        </div>

        {/* ── 3. Client ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={3} title="Client Assignment" desc="Party represented in this case" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client Name">
              <Input value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Client Type">
              <Select value={form.clientType} onChange={(e) => set('clientType', e.target.value)}>
                {CLIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Client ID (Firestore)" hint="Optional">
              <Input value={form.clientId} onChange={(e) => set('clientId', e.target.value)} placeholder="Firestore document ID" />
            </Field>
            <Field label="Client Phone">
              <Input type="tel" value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </Field>
          </div>
        </div>

        {/* ── 4. Property ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={4} title="Property Assignment" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Property Name">
              <Input value={form.propertyName} onChange={(e) => set('propertyName', e.target.value)} placeholder="e.g. Sunrise Apts, Flat 4B" />
            </Field>
            <Field label="Property ID (Firestore)" hint="Optional">
              <Input value={form.propertyId} onChange={(e) => set('propertyId', e.target.value)} placeholder="Firestore document ID" />
            </Field>
            <Field label="Property Address" className="sm:col-span-2">
              <Input value={form.propertyAddress} onChange={(e) => set('propertyAddress', e.target.value)} placeholder="Full address" />
            </Field>
          </div>
        </div>

        {/* ── 5. Court Details ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={5} title="Court Details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Court Name">
              <Input value={form.courtName} onChange={(e) => set('courtName', e.target.value)} placeholder="e.g. Bombay High Court" />
            </Field>
            <Field label="Court Location / Bench">
              <Input value={form.courtLocation} onChange={(e) => set('courtLocation', e.target.value)} placeholder="e.g. Mumbai" />
            </Field>
            <Field label="Judge Assigned">
              <Input value={form.judgeAssigned} onChange={(e) => set('judgeAssigned', e.target.value)} placeholder="Hon. Justice …" />
            </Field>
          </div>
        </div>

        {/* ── 6. Key Dates ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={6} title="Key Dates" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Filing Date">
              <Input type="date" value={form.filingDate} onChange={(e) => set('filingDate', e.target.value)} />
            </Field>
            <Field label="Next Hearing Date">
              <Input type="date" value={form.nextHearingDate} onChange={(e) => set('nextHearingDate', e.target.value)} />
            </Field>
            <Field label="Closing / Resolution Date">
              <Input type="date" value={form.closingDate} onChange={(e) => set('closingDate', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* ── 7. Financial ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={7} title="Financial Details" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Claim Amount (₹)">
              <Input type="number" min="0" value={form.claimAmount} onChange={(e) => set('claimAmount', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Settled Amount (₹)">
              <Input type="number" min="0" value={form.settledAmount} onChange={(e) => set('settledAmount', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Legal Fees (₹)">
              <Input type="number" min="0" value={form.legalFees} onChange={(e) => set('legalFees', e.target.value)} placeholder="0" />
            </Field>
          </div>
        </div>

        {/* ── 8. Documents ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={8} title="Case Documents" desc="Upload notices, agreements, orders, affidavits" />
          <FileDropZone
            label="Drop documents here"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            files={docFiles}
            onChange={setDocFiles}
            existingFiles={form.documents}
            onRemoveExisting={removeDoc}
          />
        </div>

        {/* ── 9. Evidence ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={9} title="Evidence Upload" desc="Photos, receipts, proof of payment, inspection reports" />
          <FileDropZone
            label="Drop evidence files here"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
            files={evFiles}
            onChange={setEvFiles}
            existingFiles={form.evidence}
            onRemoveExisting={removeEvidence}
          />
        </div>

        {/* ── 10. Notes ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={10} title="Notes & Remarks" />
          <textarea
            rows={3}
            placeholder="Internal notes, instructions, or observations…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : isEdit ? 'Update Case' : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  );
}
