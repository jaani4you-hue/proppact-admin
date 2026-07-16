import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Upload, X, Loader2, Camera,
  FileText, Trash2, AlertCircle,
} from 'lucide-react';
import { createUser, updateUser, getUserById } from '../../services/userService.js';
import UserAvatar from '../../components/users/UserAvatar.jsx';

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

const ROLES    = ['Admin', 'Manager', 'Agent', 'Viewer'];
const GENDERS  = ['Male', 'Female', 'Other'];
const STATUSES = [
  { value: 'Active',    color: 'emerald' },
  { value: 'Inactive',  color: 'gray'    },
  { value: 'Suspended', color: 'red'     },
];

const EMPTY = {
  fullName: '', mobile: '', email: '', photo: '',
  gender: '', dateOfBirth: '',
  aadhaarNumber: '', panNumber: '',
  address: '', state: '', city: '', pincode: '',
  role: 'Viewer', status: 'Active',
  notes: '',
  documents: [],
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

const ic  = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors';
const eic = 'w-full rounded-lg border border-red-300 bg-red-50/30 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 transition-colors';

const STATUS_ACTIVE_CLS = {
  emerald: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  gray:    'border-gray-400 bg-gray-100 text-gray-700',
  red:     'border-red-400 bg-red-50 text-red-700',
};
const STATUS_DOT_CLS = {
  emerald: 'bg-emerald-500',
  gray:    'bg-gray-500',
  red:     'bg-red-500',
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function UserForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form,         setForm]         = useState(EMPTY);
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [docFiles,     setDocFiles]     = useState([]);
  const [initLoading,  setInitLoading]  = useState(isEdit);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});
  const [globalError,  setGlobalError]  = useState('');

  const photoRef = useRef(null);
  const docRef   = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getUserById(id);
        if (cancelled) return;
        if (!data) { navigate('/admin/users', { replace: true }); return; }
        setForm({
          fullName:      data.fullName      ?? '',
          mobile:        data.mobile        ?? '',
          email:         data.email         ?? '',
          photo:         data.photo         ?? '',
          gender:        data.gender        ?? '',
          dateOfBirth:   data.dateOfBirth   ?? '',
          aadhaarNumber: data.aadhaarNumber ?? '',
          panNumber:     data.panNumber     ?? '',
          address:       data.address       ?? '',
          state:         data.state         ?? '',
          city:          data.city          ?? '',
          pincode:       data.pincode       ?? '',
          role:          data.role          ?? 'Viewer',
          status:        data.status        ?? 'Active',
          notes:         data.notes         ?? '',
          documents:     data.documents     ?? [],
        });
      } catch {
        if (!cancelled) setGlobalError('Failed to load user data.');
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit, navigate]);

  function set(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/'))  { setErrors((p) => ({ ...p, photo: 'Select a valid image file.' })); return; }
    if (file.size > 5 * 1024 * 1024)     { setErrors((p) => ({ ...p, photo: 'Image must be smaller than 5 MB.' })); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, photo: '' }));
  }

  function handleDocs(e) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024);
    setDocFiles((p) => [...p, ...files]);
    e.target.value = '';
  }

  function removeDocFile(idx)     { setDocFiles((p) => p.filter((_, i) => i !== idx)); }
  function removeExistingDoc(idx) { setForm((p) => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) })); }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!form.mobile.trim())   e.mobile   = 'Mobile number is required.';
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Enter a valid email address.';
    if (form.panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.trim().toUpperCase()))
      e.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F).';
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim()))
      e.pincode = 'Pincode must be 6 digits.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setSaving(true);
    setGlobalError('');
    const data = { ...form, panNumber: form.panNumber ? form.panNumber.toUpperCase() : '' };
    try {
      if (isEdit) await updateUser(id, data, photoFile, docFiles);
      else         await createUser(data, photoFile, docFiles);
      navigate('/admin/users');
    } catch (err) {
      setGlobalError(err.message ?? 'Failed to save user. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────────

  if (initLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
        {[1,2,3,4].map((n) => (
          <div key={n} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map((m) => (
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

  const displayPhoto = photoPreview || form.photo;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/admin/users')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{isEdit ? 'Edit User' : 'Add User'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? 'Update user profile and permissions' : 'Fill in the details to create a new user'}
          </p>
        </div>
      </div>

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />{globalError}
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Please fix the errors below before saving.
        </div>
      )}

      {/* ── 1. Basic Information ────────────────────────────────────────────── */}
      <Section title="Basic Information" description="Personal details and profile photo">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative">
              {displayPhoto ? (
                <img src={displayPhoto} alt="Preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-violet-200 shadow-sm" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Camera className="h-7 w-7 text-gray-400" />
                </div>
              )}
              <button type="button" onClick={() => photoRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-colors border-2 border-white">
                <Upload className="h-3.5 w-3.5" />
              </button>
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <p className="text-[11px] text-gray-400 text-center">JPG, PNG, WebP<br />Max 5 MB</p>
            {errors.photo && <p className="text-[11px] text-red-500">{errors.photo}</p>}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.fullName}>
              <input name="fullName" value={form.fullName} onChange={set}
                placeholder="e.g. Rahul Gupta" className={errors.fullName ? eic : ic} />
            </Field>
            <Field label="Mobile Number" required error={errors.mobile}>
              <input name="mobile" value={form.mobile} onChange={set}
                placeholder="10-digit mobile" maxLength={10} className={errors.mobile ? eic : ic} />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input name="email" type="email" value={form.email} onChange={set}
                placeholder="user@example.com" className={errors.email ? eic : ic} />
            </Field>
            <Field label="Gender">
              <select name="gender" value={form.gender} onChange={set}
                className={`${ic} appearance-none cursor-pointer`}>
                <option value="">Select gender</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Date of Birth">
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set} className={ic} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 2. Identity Documents ───────────────────────────────────────────── */}
      <Section title="Identity Documents" description="Aadhaar and PAN for KYC">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Aadhaar Number">
            <input name="aadhaarNumber" value={form.aadhaarNumber} onChange={set}
              placeholder="12-digit Aadhaar" maxLength={12} className={ic} />
          </Field>
          <Field label="PAN Number" error={errors.panNumber}>
            <input name="panNumber" value={form.panNumber} onChange={set}
              placeholder="e.g. ABCDE1234F" maxLength={10}
              className={errors.panNumber ? eic : ic} />
          </Field>
        </div>
      </Section>

      {/* ── 3. Address ──────────────────────────────────────────────────────── */}
      <Section title="Address" description="User's registered address">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Address">
            <textarea name="address" value={form.address} onChange={set} rows={2}
              placeholder="Street, Area, Landmark…" className={`${ic} resize-none`} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="State">
              <select name="state" value={form.state} onChange={set}
                className={`${ic} appearance-none cursor-pointer`}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input name="city" value={form.city} onChange={set} placeholder="e.g. Mumbai" className={ic} />
            </Field>
            <Field label="Pincode" error={errors.pincode}>
              <input name="pincode" value={form.pincode} onChange={set}
                placeholder="6-digit PIN" maxLength={6} className={errors.pincode ? eic : ic} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 4. Role & Permissions ───────────────────────────────────────────── */}
      <Section title="Role & Permissions" description="Assign a role to control access levels">
        <div className="space-y-5">
          {/* Role cards */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-3">Role</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: 'Admin',   desc: 'Full access',         color: 'rose'   },
                { value: 'Manager', desc: 'Manage operations',   color: 'orange' },
                { value: 'Agent',   desc: 'Field & client work', color: 'blue'   },
                { value: 'Viewer',  desc: 'Read-only access',    color: 'gray'   },
              ].map(({ value, desc, color }) => {
                const selected = form.role === value;
                const selCls = {
                  rose:   'border-rose-400 bg-rose-50',
                  orange: 'border-orange-400 bg-orange-50',
                  blue:   'border-blue-400 bg-blue-50',
                  gray:   'border-gray-400 bg-gray-100',
                }[color];
                const dotCls = {
                  rose: 'bg-rose-500', orange: 'bg-orange-500', blue: 'bg-blue-500', gray: 'bg-gray-500',
                }[color];
                const textCls = {
                  rose: 'text-rose-700', orange: 'text-orange-700', blue: 'text-blue-700', gray: 'text-gray-700',
                }[color];
                return (
                  <label key={value}
                    className={`relative flex flex-col gap-1 rounded-xl border-2 p-3 cursor-pointer transition-all ${selected ? selCls : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input type="radio" name="role" value={value} checked={selected} onChange={set} className="hidden" />
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${selected ? textCls : 'text-gray-700'}`}>{value}</span>
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${selected ? dotCls : 'bg-gray-200'}`} />
                    </div>
                    <span className="text-[11px] text-gray-400">{desc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-3">Status</p>
            <div className="flex flex-wrap gap-3">
              {STATUSES.map(({ value, color }) => {
                const active = form.status === value;
                return (
                  <label key={value}
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-all ${active ? STATUS_ACTIVE_CLS[color] : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                    <input type="radio" name="status" value={value} checked={active} onChange={set} className="hidden" />
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${active ? STATUS_DOT_CLS[color] : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium">{value}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 5. Documents ────────────────────────────────────────────────────── */}
      <Section title="Documents" description="Upload any supporting documents (max 10 MB each)">
        <div className="space-y-3">
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

          {/* Queued */}
          {docFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Files to upload</p>
              {docFiles.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{f.name}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                  <button type="button" onClick={() => removeDocFile(idx)}
                    className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => docRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-500 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-600 transition-colors w-full justify-center">
            <Upload className="h-4 w-4" />Click to add documents
          </button>
          <input ref={docRef} type="file" multiple className="hidden" onChange={handleDocs} />
        </div>
      </Section>

      {/* ── 6. Notes ────────────────────────────────────────────────────────── */}
      <Section title="Notes" description="Internal remarks or additional context">
        <textarea name="notes" value={form.notes} onChange={set} rows={3}
          placeholder="Optional internal notes about this user…"
          className={`${ic} resize-none`} />
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button type="button" onClick={() => navigate('/admin/users')} disabled={saving}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-60">
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
            : isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
