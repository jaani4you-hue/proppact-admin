import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ShieldCheck,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Upload,
  Image,
  FileText,
  Loader2,
} from 'lucide-react';
import { createVerification } from '../../services/verificationService.js';

// ── Reusable field components ──────────────────────────────────────────────────

function FieldGroup({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FileZone({ label, accept, multiple, files, onChange, icon: Icon = Upload }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-5 px-4 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600">Browse files</p>
          <p className="text-[11px] text-gray-400">{accept}</p>
        </div>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => onChange(Array.from(e.target.files))}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600"
            >
              <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{f.name}</span>
              <span className="ml-auto text-gray-400 font-mono whitespace-nowrap">
                {(f.size / 1024).toFixed(1)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  'Residential', 'Commercial', 'Apartment', 'Villa', 'Plot', 'Industrial', 'Other',
];

export default function VerificationForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    propertyName: '',
    propertyAddress: '',
    propertyType: 'Residential',
    ownerName: '',
    ownerContact: '',
    ownerEmail: '',
    assignedOfficer: '',
    notes: '',
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [docFiles, setDocFiles]     = useState([]);
  const [reportFile, setReportFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.propertyName.trim()) { setError('Property name is required.'); return; }
    if (!form.ownerName.trim())    { setError('Owner name is required.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const id = await createVerification(form, imageFiles, docFiles, reportFile);
      navigate(`/admin/verification/${id}`);
    } catch (err) {
      setError(err.message ?? 'Failed to create verification request.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/verification')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-800">New Verification Request</h1>
          <p className="text-xs text-gray-500 mt-0.5">Submit a new property for verification</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/verification')}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : <><ShieldCheck className="h-4 w-4" /> Submit Request</>}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Property info */}
        <Section title="Property Information" icon={Building2}>
          <FieldGroup label="Property Name" required>
            <input
              name="propertyName"
              value={form.propertyName}
              onChange={handleChange}
              placeholder="e.g. Green Valley Apartment 4B"
              className={inputCls}
            />
          </FieldGroup>
          <FieldGroup label="Property Address">
            <textarea
              name="propertyAddress"
              value={form.propertyAddress}
              onChange={handleChange}
              placeholder="Full address…"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </FieldGroup>
          <FieldGroup label="Property Type">
            <select
              name="propertyType"
              value={form.propertyType}
              onChange={handleChange}
              className={`${inputCls} appearance-none cursor-pointer`}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FieldGroup>
        </Section>

        {/* Owner info */}
        <Section title="Owner Information" icon={User}>
          <FieldGroup label="Owner Name" required>
            <input
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              placeholder="Full legal name"
              className={inputCls}
            />
          </FieldGroup>
          <FieldGroup label="Contact Number">
            <input
              name="ownerContact"
              value={form.ownerContact}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
              type="tel"
              className={inputCls}
            />
          </FieldGroup>
          <FieldGroup label="Email Address">
            <input
              name="ownerEmail"
              value={form.ownerEmail}
              onChange={handleChange}
              placeholder="owner@example.com"
              type="email"
              className={inputCls}
            />
          </FieldGroup>
        </Section>
      </div>

      {/* Assignment & Notes */}
      <Section title="Assignment & Notes" icon={ShieldCheck}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Assign Officer">
            <input
              name="assignedOfficer"
              value={form.assignedOfficer}
              onChange={handleChange}
              placeholder="Officer name (optional)"
              className={inputCls}
            />
          </FieldGroup>
          <FieldGroup label="Initial Notes">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any initial remarks…"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </FieldGroup>
        </div>
      </Section>

      {/* File uploads */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Upload className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Attach Files</h3>
          <span className="text-xs text-gray-400 ml-auto">Optional</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FileZone
            label="Property Images"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            files={imageFiles}
            onChange={setImageFiles}
            icon={Image}
          />
          <FileZone
            label="Supporting Documents"
            accept=".pdf,.doc,.docx,.xlsx"
            multiple
            files={docFiles}
            onChange={setDocFiles}
            icon={FileText}
          />
          <FileZone
            label="Verification Report"
            accept=".pdf"
            multiple={false}
            files={reportFile ? [reportFile] : []}
            onChange={(files) => setReportFile(files[0] ?? null)}
            icon={ShieldCheck}
          />
        </div>
      </div>

    </form>
  );
}
