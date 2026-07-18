import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import {
  createMaintenanceRequest,
  updateMaintenanceRequest,
  getMaintenanceRequestById,
  generateMaintenanceNumber,
} from '../../services/maintenanceService.js';
import { fetchAllVendors } from '../../services/vendorService.js';

const CATEGORIES = [
  'Plumbing', 'Electrical', 'Civil/Structural', 'Painting', 'Carpentry',
  'HVAC', 'Pest Control', 'Cleaning', 'Lift/Elevator', 'Other',
];
const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];
const STATUSES   = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];

const EMPTY = {
  maintenanceNumber : '',
  title             : '',
  category          : 'Plumbing',
  priority          : 'Medium',
  status            : 'Pending',
  description       : '',
  propertyName      : '',
  propertyId        : '',
  propertyAddress   : '',
  unitNumber        : '',
  complaintId       : '',
  complaintNumber   : '',
  assignedVendorId  : '',
  assignedVendorName: '',
  assignedVendorPhone:'',
  scheduledDate     : '',
  completedDate     : '',
  estimatedCost     : '',
  actualCost        : '',
  notes             : '',
  attachments       : [],
};

function SectionTitle({ n, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">{n}</div>
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
    <input className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${className}`} {...props} />
  );
}
function Select({ children, ...props }) {
  return (
    <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...props}>
      {children}
    </select>
  );
}

function FileDropZone({ label, files, onChange, existingFiles = [], onRemoveExisting }) {
  const inputRef = useRef();
  function handleDrop(e) {
    e.preventDefault();
    onChange([...files, ...Array.from(e.dataTransfer.files)]);
  }
  function handleChange(e) {
    onChange([...files, ...Array.from(e.target.files)]);
    e.target.value = '';
  }
  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
      >
        <Upload className="mb-2 h-5 w-5 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400">Drag & drop or click to browse</p>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple className="hidden" onChange={handleChange} />
      </div>
      {existingFiles.length > 0 && (
        <div className="space-y-1.5">
          {existingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2">
              <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-blue-600 hover:underline truncate" onClick={(e) => e.stopPropagation()}>{f.name}</a>
              <span className="text-[10px] text-gray-400">Saved</span>
              {onRemoveExisting && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveExisting(i); }} className="text-gray-300 hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
              {f.type?.startsWith('image/') ? <ImageIcon className="h-3.5 w-3.5 text-gray-500" /> : <FileText className="h-3.5 w-3.5 text-gray-500" />}
              <span className="flex-1 text-xs text-gray-700 truncate">{f.name}</span>
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MaintenanceForm() {
  const navigate      = useNavigate();
  const { id }        = useParams();
  const [searchParams] = useSearchParams();
  const isEdit        = Boolean(id);

  const [form,        setForm]        = useState({
    ...EMPTY,
    maintenanceNumber: generateMaintenanceNumber(),
    complaintId      : searchParams.get('complaintId')     || '',
    complaintNumber  : searchParams.get('complaintNumber') || '',
    title            : searchParams.get('title')           || '',
    propertyName     : searchParams.get('propertyName')    || '',
    propertyId       : searchParams.get('propertyId')      || '',
  });
  const [attachFiles, setAttachFiles] = useState([]);
  const [vendors,     setVendors]     = useState([]);
  const [loading,     setLoading]     = useState(isEdit);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    fetchAllVendors().then((vs) => setVendors(vs.filter((v) => v.status === 'Active')));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getMaintenanceRequestById(id).then((r) => {
      if (r) setForm({ ...EMPTY, ...r, estimatedCost: String(r.estimatedCost ?? ''), actualCost: String(r.actualCost ?? '') });
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleVendorChange(vendorId) {
    const v = vendors.find((x) => x.id === vendorId);
    setForm((f) => ({
      ...f,
      assignedVendorId  : vendorId,
      assignedVendorName: v?.name  || '',
      assignedVendorPhone: v?.phone || '',
    }));
  }

  function removeAttachment(idx) {
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Request title is required.');
    setSaving(true); setError(null);
    const data = { ...form, estimatedCost: Number(form.estimatedCost) || 0, actualCost: Number(form.actualCost) || 0 };
    try {
      if (isEdit) {
        await updateMaintenanceRequest(id, data, attachFiles);
        navigate(`/admin/maintenance/${id}`);
      } else {
        const newId = await createMaintenanceRequest(data, attachFiles);
        navigate(`/admin/maintenance/${newId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save.');
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Maintenance Request' : 'New Maintenance Request'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? 'Update the work order details.' : 'Create a new maintenance work order.'}</p>
        </div>
      </div>

      {form.complaintNumber && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Linked to complaint <span className="font-mono font-semibold">{form.complaintNumber}</span>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Identity */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={1} title="Request Identity" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Request Number">
              <Input value={form.maintenanceNumber} onChange={(e) => set('maintenanceNumber', e.target.value)} placeholder="Auto-generated" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Title" required className="sm:col-span-2">
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Fix leaking pipe in Flat 4B" />
            </Field>
            <Field label="Category" required>
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the issue and work required…"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none" />
          </Field>
        </div>

        {/* 2. Property */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={2} title="Property Details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Property Name">
              <Input value={form.propertyName} onChange={(e) => set('propertyName', e.target.value)} placeholder="e.g. Sunrise Apts" />
            </Field>
            <Field label="Unit / Flat Number">
              <Input value={form.unitNumber} onChange={(e) => set('unitNumber', e.target.value)} placeholder="e.g. 4B" />
            </Field>
            <Field label="Property ID (Firestore)" hint="Optional">
              <Input value={form.propertyId} onChange={(e) => set('propertyId', e.target.value)} placeholder="Firestore document ID" />
            </Field>
            <Field label="Property Address">
              <Input value={form.propertyAddress} onChange={(e) => set('propertyAddress', e.target.value)} placeholder="Full address" />
            </Field>
          </div>
        </div>

        {/* 3. Vendor */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={3} title="Vendor Assignment" desc="Assign an active service vendor" />
          <Field label="Select Vendor">
            <Select value={form.assignedVendorId} onChange={(e) => handleVendorChange(e.target.value)}>
              <option value="">— Unassigned —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
              ))}
            </Select>
          </Field>
          {form.assignedVendorName && (
            <div className="flex items-center gap-3 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-200 text-orange-700 text-xs font-bold flex-shrink-0">
                {form.assignedVendorName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{form.assignedVendorName}</p>
                {form.assignedVendorPhone && <p className="text-xs text-gray-500">{form.assignedVendorPhone}</p>}
              </div>
            </div>
          )}
        </div>

        {/* 4. Schedule & Cost */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={4} title="Schedule & Cost" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Scheduled Date">
              <Input type="date" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
            </Field>
            <Field label="Completed Date">
              <Input type="date" value={form.completedDate} onChange={(e) => set('completedDate', e.target.value)} />
            </Field>
            <Field label="Estimated Cost (₹)">
              <Input type="number" min="0" value={form.estimatedCost} onChange={(e) => set('estimatedCost', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Actual Cost (₹)">
              <Input type="number" min="0" value={form.actualCost} onChange={(e) => set('actualCost', e.target.value)} placeholder="0" />
            </Field>
          </div>
        </div>

        {/* 5. Attachments */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={5} title="Attachments" desc="Photos, reports, bills" />
          <FileDropZone
            label="Drop files here"
            files={attachFiles}
            onChange={setAttachFiles}
            existingFiles={form.attachments}
            onRemoveExisting={removeAttachment}
          />
        </div>

        {/* 6. Notes */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={6} title="Notes & Remarks" />
          <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)}
            placeholder="Internal notes, instructions…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : isEdit ? 'Update Request' : 'Create Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
