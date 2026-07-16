import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Upload, X, Loader2, Camera,
  FileText, Trash2, AlertCircle,
} from 'lucide-react';
import { createOwner, updateOwner, getOwnerById } from '../../services/ownerService.js';
import OwnerAvatar from '../../components/owners/OwnerAvatar.jsx';

// ── Constants ──────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands',
  'Chandigarh','Dadra & Nagar Haveli and Daman & Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const EMPTY_BANK = { bankName: '', accountNumber: '', ifscCode: '', accountType: 'Savings' };

const EMPTY_FORM = {
  fullName: '',
  mobile: '',
  email: '',
  photo: '',
  aadhaarNumber: '',
  panNumber: '',
  address: '',
  state: '',
  city: '',
  pincode: '',
  ownedProperties: '',
  activeTenants: '',
  totalRentCollection: '',
  bankDetails: { ...EMPTY_BANK },
  documents: [],
  status: 'Active',
};

// ── UI helpers ─────────────────────────────────────────────────────────────────

function Section({ title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors';
const errorInputCls =
  'w-full rounded-lg border border-red-300 bg-red-50/30 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 transition-colors';

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OwnerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form,           setForm]           = useState(EMPTY_FORM);
  const [photoFile,      setPhotoFile]      = useState(null);
  const [photoPreview,   setPhotoPreview]   = useState('');
  const [newDocFiles,    setNewDocFiles]    = useState([]);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving,         setSaving]         = useState(false);
  const [errors,         setErrors]         = useState({});
  const [globalError,    setGlobalError]    = useState('');

  const photoInputRef = useRef(null);
  const docInputRef   = useRef(null);

  // Load existing owner for edit
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const owner = await getOwnerById(id);
        if (cancelled) return;
        if (!owner) { navigate('/admin/owners', { replace: true }); return; }
        setForm({
          fullName:            owner.fullName ?? '',
          mobile:              owner.mobile ?? '',
          email:               owner.email ?? '',
          photo:               owner.photo ?? '',
          aadhaarNumber:       owner.aadhaarNumber ?? '',
          panNumber:           owner.panNumber ?? '',
          address:             owner.address ?? '',
          state:               owner.state ?? '',
          city:                owner.city ?? '',
          pincode:             owner.pincode ?? '',
          ownedProperties:     Array.isArray(owner.ownedProperties)
                                 ? owner.ownedProperties.join(', ')
                                 : (owner.ownedProperties ?? ''),
          activeTenants:       owner.activeTenants != null ? String(owner.activeTenants) : '',
          totalRentCollection: owner.totalRentCollection != null ? String(owner.totalRentCollection) : '',
          bankDetails:         { ...EMPTY_BANK, ...(owner.bankDetails ?? {}) },
          documents:           owner.documents ?? [],
          status:              owner.status ?? 'Active',
        });
      } catch {
        if (!cancelled) setGlobalError('Failed to load owner data.');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit, navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleBankChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, [name]: value } }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((p) => ({ ...p, photo: 'Please select a valid image file.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo: 'Image must be smaller than 5 MB.' }));
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, photo: '' }));
  }

  function handleDocFilesChange(e) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
    if (valid.length < files.length)
      setErrors((p) => ({ ...p, documents: 'Some files exceed 10 MB and were skipped.' }));
    setNewDocFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  }

  function removeNewDoc(idx) { setNewDocFiles((p) => p.filter((_, i) => i !== idx)); }
  function removeExistingDoc(idx) {
    setForm((p) => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }));
  }

  function validate() {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.mobile.trim())   errs.mobile   = 'Mobile number is required.';
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim()))
      errs.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = 'Enter a valid email address.';
    if (form.panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.trim().toUpperCase()))
      errs.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F).';
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim()))
      errs.pincode = 'Pincode must be 6 digits.';
    if (form.activeTenants && isNaN(Number(form.activeTenants)))
      errs.activeTenants = 'Must be a number.';
    if (form.totalRentCollection && isNaN(Number(form.totalRentCollection)))
      errs.totalRentCollection = 'Must be a number.';
    if (form.bankDetails.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankDetails.ifscCode.toUpperCase()))
      errs.ifscCode = 'Enter a valid IFSC code (e.g. SBIN0001234).';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    setGlobalError('');

    const data = {
      ...form,
      panNumber: form.panNumber ? form.panNumber.toUpperCase() : '',
      bankDetails: {
        ...form.bankDetails,
        ifscCode: form.bankDetails.ifscCode ? form.bankDetails.ifscCode.toUpperCase() : '',
      },
      ownedProperties: form.ownedProperties
        ? form.ownedProperties.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      activeTenants:       form.activeTenants ? Number(form.activeTenants) : 0,
      totalRentCollection: form.totalRentCollection ? Number(form.totalRentCollection) : 0,
    };

    try {
      if (isEdit) await updateOwner(id, data, photoFile, newDocFiles);
      else         await createOwner(data, photoFile, newDocFiles);
      navigate('/admin/owners');
    } catch (err) {
      setGlobalError(err.message ?? 'Failed to save owner. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((m) => (
                <div key={m} className="space-y-1.5">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-10 rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const displayPhoto = photoPreview || form.photo;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/owners')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{isEdit ? 'Edit Owner' : 'Add Owner'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? 'Update owner information and documents' : 'Fill in the details to register a new property owner'}
          </p>
        </div>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {globalError}
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Please fix the errors below before saving.
        </div>
      )}

      {/* ── Section 1: Basic Info + Photo ──────────────────────────────────── */}
      <Section title="Basic Information" description="Name, contact details and profile photo">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-teal-200 shadow-sm"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Camera className="h-7 w-7 text-gray-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-colors border-2 border-white"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <p className="text-[11px] text-gray-400 text-center">JPG, PNG, WebP<br />Max 5 MB</p>
            {errors.photo && <p className="text-[11px] text-red-500">{errors.photo}</p>}
          </div>

          {/* Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.fullName}>
              <input name="fullName" value={form.fullName} onChange={handleChange}
                placeholder="e.g. Suresh Sharma"
                className={errors.fullName ? errorInputCls : inputCls} />
            </Field>
            <Field label="Mobile Number" required error={errors.mobile}>
              <input name="mobile" value={form.mobile} onChange={handleChange}
                placeholder="10-digit mobile" maxLength={10}
                className={errors.mobile ? errorInputCls : inputCls} />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="owner@example.com"
                className={errors.email ? errorInputCls : inputCls} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Identity ────────────────────────────────────────────── */}
      <Section title="Identity Documents" description="Aadhaar and PAN for KYC verification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Aadhaar Number" error={errors.aadhaarNumber}>
            <input name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange}
              placeholder="12-digit Aadhaar" maxLength={12} className={inputCls} />
          </Field>
          <Field label="PAN Number" error={errors.panNumber}>
            <input name="panNumber" value={form.panNumber} onChange={handleChange}
              placeholder="e.g. ABCDE1234F" maxLength={10}
              className={errors.panNumber ? errorInputCls : inputCls} />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Address ────────────────────────────────────────────── */}
      <Section title="Address" description="Owner's registered address">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Address">
            <textarea name="address" value={form.address} onChange={handleChange}
              rows={2} placeholder="Street, Area, Landmark…"
              className={`${inputCls} resize-none`} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="State">
              <select name="state" value={form.state} onChange={handleChange}
                className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input name="city" value={form.city} onChange={handleChange}
                placeholder="e.g. Pune" className={inputCls} />
            </Field>
            <Field label="Pincode" error={errors.pincode}>
              <input name="pincode" value={form.pincode} onChange={handleChange}
                placeholder="6-digit PIN" maxLength={6}
                className={errors.pincode ? errorInputCls : inputCls} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 4: Property & Rent Info ───────────────────────────────── */}
      <Section title="Property & Rent Information" description="Owned properties, tenants and rent collection details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Owned Properties" error={errors.ownedProperties}>
              <input name="ownedProperties" value={form.ownedProperties} onChange={handleChange}
                placeholder="Comma-separated property IDs, e.g. prop-001, prop-002"
                className={inputCls} />
            </Field>
          </div>
          <Field label="Active Tenants" error={errors.activeTenants}>
            <input name="activeTenants" value={form.activeTenants} onChange={handleChange}
              placeholder="e.g. 3" type="number" min="0"
              className={errors.activeTenants ? errorInputCls : inputCls} />
          </Field>
          <Field label="Total Rent Collection (₹)" error={errors.totalRentCollection}>
            <input name="totalRentCollection" value={form.totalRentCollection} onChange={handleChange}
              placeholder="e.g. 150000" type="number" min="0"
              className={errors.totalRentCollection ? errorInputCls : inputCls} />
          </Field>
        </div>
      </Section>

      {/* ── Section 5: Bank Details ────────────────────────────────────────── */}
      <Section title="Bank Details" description="Account information for rent disbursement">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Bank Name">
            <input name="bankName" value={form.bankDetails.bankName} onChange={handleBankChange}
              placeholder="e.g. State Bank of India" className={inputCls} />
          </Field>
          <Field label="Account Number">
            <input name="accountNumber" value={form.bankDetails.accountNumber} onChange={handleBankChange}
              placeholder="Account number" className={`${inputCls} font-mono`} />
          </Field>
          <Field label="IFSC Code" error={errors.ifscCode}>
            <input name="ifscCode" value={form.bankDetails.ifscCode} onChange={handleBankChange}
              placeholder="e.g. SBIN0001234" maxLength={11}
              className={errors.ifscCode ? `${errorInputCls} font-mono` : `${inputCls} font-mono`} />
          </Field>
          <Field label="Account Type">
            <div className="flex gap-3 mt-1">
              {['Savings', 'Current'].map((t) => (
                <label key={t} className={[
                  'flex items-center gap-2 rounded-lg border px-4 py-2.5 cursor-pointer transition-all flex-1 justify-center',
                  form.bankDetails.accountType === t
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
                ].join(' ')}>
                  <input type="radio" name="accountType" value={t}
                    checked={form.bankDetails.accountType === t}
                    onChange={handleBankChange} className="hidden" />
                  <span className={[
                    'h-2 w-2 rounded-full flex-shrink-0',
                    form.bankDetails.accountType === t ? 'bg-orange-500' : 'bg-gray-300',
                  ].join(' ')} />
                  <span className="text-sm font-medium">{t}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Section 6: Documents ──────────────────────────────────────────── */}
      <Section title="Documents" description="Upload agreements, KYC or any supporting files (max 10 MB each)">
        <div className="space-y-4">
          {/* Existing */}
          {form.documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Existing documents</p>
              {form.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate">
                      {doc.name || 'Document'}
                    </a>
                  </div>
                  <button type="button" onClick={() => removeExistingDoc(idx)}
                    className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Queued new files */}
          {newDocFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Files to upload</p>
              {newDocFiles.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{f.name}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button type="button" onClick={() => removeNewDoc(idx)}
                    className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.documents && <p className="text-xs text-amber-600">{errors.documents}</p>}

          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-500 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-600 transition-colors w-full justify-center"
          >
            <Upload className="h-4 w-4" />
            Click to add documents
          </button>
          <input ref={docInputRef} type="file" multiple className="hidden" onChange={handleDocFilesChange} />
        </div>
      </Section>

      {/* ── Section 7: Status ─────────────────────────────────────────────── */}
      <Section title="Status" description="Set the owner's current account status">
        <div className="flex flex-wrap gap-3">
          {['Active', 'Inactive', 'Suspended'].map((s) => (
            <label key={s} className={[
              'flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-all',
              form.status === s
                ? s === 'Active'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : s === 'Inactive'
                    ? 'border-gray-400 bg-gray-100 text-gray-700'
                    : 'border-red-400 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
            ].join(' ')}>
              <input type="radio" name="status" value={s}
                checked={form.status === s} onChange={handleChange} className="hidden" />
              <span className={[
                'h-2 w-2 rounded-full flex-shrink-0',
                form.status === s
                  ? s === 'Active' ? 'bg-emerald-500' : s === 'Inactive' ? 'bg-gray-500' : 'bg-red-500'
                  : 'bg-gray-300',
              ].join(' ')} />
              <span className="text-sm font-medium">{s}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button type="button" onClick={() => navigate('/admin/owners')} disabled={saving}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-60">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
          ) : (
            isEdit ? 'Save Changes' : 'Create Owner'
          )}
        </button>
      </div>
    </form>
  );
}
