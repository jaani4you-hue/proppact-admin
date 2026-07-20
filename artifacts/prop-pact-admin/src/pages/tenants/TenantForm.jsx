import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, X, Loader2, Camera, FileText, Trash2, AlertCircle } from 'lucide-react';
import { createTenant, updateTenant, getTenantById } from '../../services/tenantService.js';
import { useProperties } from '../../hooks/useProperties.js';
import TenantAvatar from '../../components/tenants/TenantAvatar.jsx';

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

const NAMED_DOC_SLOTS = [
  { type: 'aadhaar_doc',        label: 'Aadhaar Card' },
  { type: 'pan_doc',            label: 'PAN Card' },
  { type: 'rent_agreement',     label: 'Rent Agreement' },
  { type: 'police_verification',label: 'Police Verification' },
];

const EMPTY_FORM = {
  fullName: '', mobile: '', alternateMobile: '', email: '',
  photo: '', gender: '', dateOfBirth: '',
  aadhaarNumber: '', panNumber: '',
  currentAddress: '', state: '', city: '', pincode: '',
  assignedProperty: '', propertyId: '', owner: '', dealer: '',
  monthlyRent: '', securityDeposit: '', rentDueDate: '', leaseStartDate: '',
  leaseEndDate: '', occupancyStatus: 'Occupied',
  totalPaid: '', pendingAmount: '', lastPaymentDate: '', paymentStatus: 'Pending',
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

const ic  = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors';
const eic = 'w-full rounded-lg border border-red-300 bg-red-50/30 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 transition-colors';

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TenantForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const { properties, loading: propsLoading } = useProperties({ pageSize: 1000 });

  const [form,         setForm]         = useState(EMPTY_FORM);
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  // Named doc files: { aadhaar_doc: File|null, ... }
  const [namedFiles,   setNamedFiles]   = useState(
    Object.fromEntries(NAMED_DOC_SLOTS.map((s) => [s.type, null]))
  );
  const [otherFiles,   setOtherFiles]   = useState([]);
  const [initLoading,  setInitLoading]  = useState(isEdit);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});
  const [globalError,  setGlobalError]  = useState('');

  const photoRef = useRef(null);
  const otherRef = useRef(null);
  const namedRefs = useRef(
    Object.fromEntries(NAMED_DOC_SLOTS.map((s) => [s.type, { current: null }]))
  );

  // Load for edit
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getTenantById(id);
        if (cancelled) return;
        if (!data) { navigate('/admin/tenants', { replace: true }); return; }
        setForm({
          fullName:        data.fullName        ?? '',
          mobile:          data.mobile          ?? '',
          alternateMobile: data.alternateMobile ?? '',
          email:           data.email           ?? '',
          photo:           data.photo           ?? '',
          gender:          data.gender          ?? '',
          dateOfBirth:     data.dateOfBirth     ?? '',
          aadhaarNumber:   data.aadhaarNumber   ?? '',
          panNumber:       data.panNumber       ?? '',
          currentAddress:  data.currentAddress  ?? '',
          state:           data.state           ?? '',
          city:            data.city            ?? '',
          pincode:         data.pincode         ?? '',
          assignedProperty: data.assignedProperty ?? '',
          propertyId:       data.propertyId       ?? '',
          owner:           data.owner            ?? '',
          dealer:          data.dealer           ?? '',
          monthlyRent:     data.monthlyRent      != null ? String(data.monthlyRent)      : '',
          securityDeposit: data.securityDeposit  != null ? String(data.securityDeposit)  : '',
          rentDueDate:     data.rentDueDate       != null ? String(data.rentDueDate)       : '',
          leaseStartDate:  data.leaseStartDate   ?? '',
          leaseEndDate:    data.leaseEndDate     ?? '',
          occupancyStatus: data.occupancyStatus  ?? 'Occupied',
          totalPaid:       data.totalPaid        != null ? String(data.totalPaid)        : '',
          pendingAmount:   data.pendingAmount    != null ? String(data.pendingAmount)    : '',
          lastPaymentDate: data.lastPaymentDate  ?? '',
          paymentStatus:   data.paymentStatus    ?? 'Pending',
          documents:       data.documents        ?? [],
          status:          data.status           ?? 'Active',
        });
      } catch {
        if (!cancelled) setGlobalError('Failed to load tenant data.');
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

  // When property changes, auto-fill owner, rent, deposit from the property doc
  function handlePropertyChange(e) {
    const pid  = e.target.value;
    const prop = properties.find((p) => p.id === pid);
    setForm((prev) => ({
      ...prev,
      propertyId:       pid,
      assignedProperty: prop ? (prop.title ?? prop.name ?? prop.propertyName ?? '') : '',
      owner:            prop ? (prop.ownerName ?? prop.owner ?? '') : prev.owner,
      monthlyRent:      prop?.monthlyRent     ? String(prop.monthlyRent)     : prev.monthlyRent,
      securityDeposit:  prop?.securityDeposit ? String(prop.securityDeposit) : prev.securityDeposit,
    }));
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/'))  { setErrors((p) => ({ ...p, photo: 'Select a valid image.' })); return; }
    if (file.size > 5 * 1024 * 1024)     { setErrors((p) => ({ ...p, photo: 'Image must be < 5 MB.' }));  return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, photo: '' }));
  }

  function handleNamedFile(type, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setErrors((p) => ({ ...p, [type]: 'File must be < 10 MB.' })); return; }
    setNamedFiles((p) => ({ ...p, [type]: file }));
    setErrors((p) => ({ ...p, [type]: '' }));
  }

  function clearNamedFile(type) { setNamedFiles((p) => ({ ...p, [type]: null })); }

  function handleOtherFiles(e) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024);
    setOtherFiles((p) => [...p, ...files]);
    e.target.value = '';
  }

  function removeOtherFile(idx) { setOtherFiles((p) => p.filter((_, i) => i !== idx)); }

  function removeExistingDoc(idx) {
    setForm((p) => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }));
  }

  // Get existing named doc for display
  function existingNamedDoc(type) { return form.documents.find((d) => d.type === type) ?? null; }
  const existingOtherDocs = form.documents.filter((d) => d.type === 'other');

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!form.mobile.trim())   e.mobile   = 'Mobile number is required.';
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (form.alternateMobile.trim() && !/^[6-9]\d{9}$/.test(form.alternateMobile.trim()))
      e.alternateMobile = 'Enter a valid 10-digit mobile number.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Enter a valid email address.';
    if (form.panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.trim().toUpperCase()))
      e.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F).';
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim()))
      e.pincode = 'Pincode must be 6 digits.';
    if (form.monthlyRent && isNaN(Number(form.monthlyRent)))   e.monthlyRent   = 'Must be a number.';
    if (form.securityDeposit && isNaN(Number(form.securityDeposit))) e.securityDeposit = 'Must be a number.';
    if (form.totalPaid && isNaN(Number(form.totalPaid)))       e.totalPaid       = 'Must be a number.';
    if (form.pendingAmount && isNaN(Number(form.pendingAmount))) e.pendingAmount = 'Must be a number.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setSaving(true);
    setGlobalError('');
    const data = {
      ...form,
      panNumber:       form.panNumber ? form.panNumber.toUpperCase() : '',
      monthlyRent:     form.monthlyRent     ? Number(form.monthlyRent)     : 0,
      securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : 0,
      rentDueDate:     form.rentDueDate     ? Number(form.rentDueDate)     : null,
      totalPaid:       form.totalPaid       ? Number(form.totalPaid)       : 0,
      pendingAmount:   form.pendingAmount   ? Number(form.pendingAmount)   : 0,
    };
    try {
      if (isEdit) await updateTenant(id, data, photoFile, namedFiles, otherFiles);
      else         await createTenant(data, photoFile, namedFiles, otherFiles);
      navigate('/admin/tenants');
    } catch (err) {
      setGlobalError(err.message ?? 'Failed to save tenant. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────────

  if (initLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
        {[1,2,3,4,5].map((n) => (
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
        <button type="button" onClick={() => navigate('/admin/tenants')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{isEdit ? 'Edit Tenant' : 'Add Tenant'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? 'Update tenant information and documents' : 'Fill in the details to register a new tenant'}
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
                  className="h-24 w-24 rounded-full object-cover border-2 border-indigo-200 shadow-sm" />
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
              <input name="fullName" value={form.fullName} onChange={set} placeholder="e.g. Amit Verma" className={errors.fullName ? eic : ic} />
            </Field>
            <Field label="Mobile Number" required error={errors.mobile}>
              <input name="mobile" value={form.mobile} onChange={set} placeholder="10-digit mobile" maxLength={10} className={errors.mobile ? eic : ic} />
            </Field>
            <Field label="Alternate Mobile" error={errors.alternateMobile}>
              <input name="alternateMobile" value={form.alternateMobile} onChange={set} placeholder="Optional" maxLength={10} className={errors.alternateMobile ? eic : ic} />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input name="email" type="email" value={form.email} onChange={set} placeholder="tenant@example.com" className={errors.email ? eic : ic} />
            </Field>
            <Field label="Gender">
              <select name="gender" value={form.gender} onChange={set} className={`${ic} appearance-none cursor-pointer`}>
                <option value="">Select gender</option>
                {['Male','Female','Other'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Date of Birth">
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set} className={ic} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 2. Identity ─────────────────────────────────────────────────────── */}
      <Section title="Identity Documents" description="Aadhaar and PAN for KYC verification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Aadhaar Number">
            <input name="aadhaarNumber" value={form.aadhaarNumber} onChange={set} placeholder="12-digit Aadhaar" maxLength={12} className={ic} />
          </Field>
          <Field label="PAN Number" error={errors.panNumber}>
            <input name="panNumber" value={form.panNumber} onChange={set} placeholder="e.g. ABCDE1234F" maxLength={10} className={errors.panNumber ? eic : ic} />
          </Field>
        </div>
      </Section>

      {/* ── 3. Address ──────────────────────────────────────────────────────── */}
      <Section title="Current Address" description="Tenant's current residential address">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Address">
            <textarea name="currentAddress" value={form.currentAddress} onChange={set} rows={2}
              placeholder="Street, Area, Landmark…" className={`${ic} resize-none`} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="State">
              <select name="state" value={form.state} onChange={set} className={`${ic} appearance-none cursor-pointer`}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input name="city" value={form.city} onChange={set} placeholder="e.g. Bangalore" className={ic} />
            </Field>
            <Field label="Pincode" error={errors.pincode}>
              <input name="pincode" value={form.pincode} onChange={set} placeholder="6-digit PIN" maxLength={6} className={errors.pincode ? eic : ic} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 4. Rental Information ───────────────────────────────────────────── */}
      <Section title="Rental Information" description="Property, lease terms and occupancy details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Property dropdown from Firestore */}
          <Field label="Assigned Property">
            <select value={form.propertyId} onChange={handlePropertyChange}
              disabled={propsLoading}
              className={`${ic} appearance-none cursor-pointer disabled:opacity-60`}>
              <option value="">{propsLoading ? 'Loading properties…' : 'Select property'}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title ?? p.name ?? p.propertyName ?? p.id}
                </option>
              ))}
            </select>
          </Field>

          {/* Owner — auto-filled, still editable */}
          <Field label="Owner">
            <input name="owner" value={form.owner} onChange={set} placeholder="Auto-filled from property" className={ic} />
          </Field>

          <Field label="Dealer">
            <input name="dealer" value={form.dealer} onChange={set} placeholder="Dealer name or ID" className={ic} />
          </Field>

          <Field label="Monthly Rent (₹)" error={errors.monthlyRent}>
            <input name="monthlyRent" value={form.monthlyRent} onChange={set} type="number" min="0" placeholder="e.g. 25000" className={errors.monthlyRent ? eic : ic} />
          </Field>

          <Field label="Security Deposit (₹)" error={errors.securityDeposit}>
            <input name="securityDeposit" value={form.securityDeposit} onChange={set} type="number" min="0" placeholder="e.g. 75000" className={errors.securityDeposit ? eic : ic} />
          </Field>

          <Field label="Rent Due Date (day of month)">
            <select name="rentDueDate" value={form.rentDueDate} onChange={set} className={`${ic} appearance-none cursor-pointer`}>
              <option value="">Select day</option>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>

          <Field label="Lease Start Date">
            <input name="leaseStartDate" type="date" value={form.leaseStartDate} onChange={set} className={ic} />
          </Field>

          <Field label="Lease End Date">
            <input name="leaseEndDate" type="date" value={form.leaseEndDate} onChange={set} className={ic} />
          </Field>

          <Field label="Occupancy Status">
            <select name="occupancyStatus" value={form.occupancyStatus} onChange={set} className={`${ic} appearance-none cursor-pointer`}>
              {['Occupied','Vacant','Notice Period'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* ── 5. Payment Information ──────────────────────────────────────────── */}
      <Section title="Payment Information" description="Rent collection and payment status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Total Paid (₹)" error={errors.totalPaid}>
            <input name="totalPaid" value={form.totalPaid} onChange={set} type="number" min="0" placeholder="e.g. 150000" className={errors.totalPaid ? eic : ic} />
          </Field>
          <Field label="Pending Amount (₹)" error={errors.pendingAmount}>
            <input name="pendingAmount" value={form.pendingAmount} onChange={set} type="number" min="0" placeholder="e.g. 25000" className={errors.pendingAmount ? eic : ic} />
          </Field>
          <Field label="Last Payment Date">
            <input name="lastPaymentDate" type="date" value={form.lastPaymentDate} onChange={set} className={ic} />
          </Field>
          <Field label="Payment Status">
            <select name="paymentStatus" value={form.paymentStatus} onChange={set} className={`${ic} appearance-none cursor-pointer`}>
              {['Paid','Pending','Overdue'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* ── 6. Documents ────────────────────────────────────────────────────── */}
      <Section title="Documents" description="Upload KYC and tenancy documents (max 10 MB each)">
        <div className="space-y-5">
          {/* Named document slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {NAMED_DOC_SLOTS.map(({ type, label }) => {
              const existing = existingNamedDoc(type);
              const queued   = namedFiles[type];
              return (
                <div key={type}>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">{label}</p>
                  {queued ? (
                    <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{queued.name}</span>
                      </div>
                      <button type="button" onClick={() => clearNamedFile(type)}
                        className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : existing ? (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a href={existing.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate">{existing.name}</a>
                      </div>
                      <button type="button" onClick={() => removeExistingDoc(form.documents.indexOf(existing))}
                        className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button"
                      onClick={() => {
                        if (!namedRefs.current[type].current) {
                          namedRefs.current[type].current = document.createElement('input');
                          namedRefs.current[type].current.type = 'file';
                          namedRefs.current[type].current.accept = '.pdf,.jpg,.jpeg,.png,.webp';
                          namedRefs.current[type].current.onchange = (e) => handleNamedFile(type, e);
                        }
                        namedRefs.current[type].current.click();
                      }}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-600 transition-colors w-full justify-center">
                      <Upload className="h-3.5 w-3.5" />Upload {label}
                    </button>
                  )}
                  {errors[type] && <p className="mt-1 text-[11px] text-red-500">{errors[type]}</p>}
                </div>
              );
            })}
          </div>

          {/* Other documents */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Other Documents</p>
            {existingOtherDocs.length > 0 && (
              <div className="space-y-2 mb-2">
                {existingOtherDocs.map((doc) => {
                  const idx = form.documents.indexOf(doc);
                  return (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate">{doc.name}</a>
                      </div>
                      <button type="button" onClick={() => removeExistingDoc(idx)}
                        className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {otherFiles.length > 0 && (
              <div className="space-y-2 mb-2">
                {otherFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{f.name}</span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button type="button" onClick={() => removeOtherFile(idx)}
                      className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => otherRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-500 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-600 transition-colors w-full justify-center">
              <Upload className="h-4 w-4" />Click to add other documents
            </button>
            <input ref={otherRef} type="file" multiple className="hidden" onChange={handleOtherFiles} />
          </div>
        </div>
      </Section>

      {/* ── 7. Status ───────────────────────────────────────────────────────── */}
      <Section title="Status" description="Set the tenant's current account status">
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'Active',        color: 'emerald' },
            { value: 'Notice Period', color: 'amber'   },
            { value: 'Vacated',       color: 'gray'    },
            { value: 'Blocked',       color: 'red'     },
          ].map(({ value, color }) => {
            const active = form.status === value;
            const cls = active
              ? color === 'emerald' ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : color === 'amber'   ? 'border-amber-400 bg-amber-50 text-amber-700'
              : color === 'gray'    ? 'border-gray-400 bg-gray-100 text-gray-700'
              :                       'border-red-400 bg-red-50 text-red-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300';
            const dot = active
              ? color === 'emerald' ? 'bg-emerald-500'
              : color === 'amber'   ? 'bg-amber-500'
              : color === 'gray'    ? 'bg-gray-500'
              :                       'bg-red-500'
              : 'bg-gray-300';
            return (
              <label key={value} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-all ${cls}`}>
                <input type="radio" name="status" value={value} checked={form.status === value} onChange={set} className="hidden" />
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-sm font-medium">{value}</span>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button type="button" onClick={() => navigate('/admin/tenants')} disabled={saving}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-60">
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
            : isEdit ? 'Save Changes' : 'Create Tenant'}
        </button>
      </div>
    </form>
  );
}
