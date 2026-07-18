import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Star } from 'lucide-react';
import {
  createVendor,
  updateVendor,
  getVendorById,
  generateVendorCode,
} from '../../services/vendorService.js';

const CATEGORIES = [
  'Plumber', 'Electrician', 'Civil/Structural', 'Painter', 'Carpenter',
  'HVAC', 'Pest Control', 'Cleaning', 'Lift/Elevator', 'General',
];
const STATUSES = ['Active', 'Inactive', 'Blacklisted'];

const EMPTY = {
  vendorCode   : '',
  name         : '',
  category     : 'Plumber',
  status       : 'Active',
  phone        : '',
  email        : '',
  address      : '',
  gstNumber    : '',
  bankName     : '',
  accountNumber: '',
  ifscCode     : '',
  rating       : 0,
  notes        : '',
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

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s === value ? 0 : s)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 ${s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-100'}`}
          />
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 text-xs text-gray-400 hover:text-gray-600"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default function VendorForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [form,    setForm]    = useState({ ...EMPTY, vendorCode: generateVendorCode() });
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getVendorById(id).then((v) => {
      if (v) setForm({ ...EMPTY, ...v, rating: Number(v.rating) || 0 });
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Vendor name is required.');
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateVendor(id, form);
        navigate(`/admin/vendors/${id}`);
      } else {
        const newId = await createVendor(form);
        navigate(`/admin/vendors/${newId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save vendor.');
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
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Vendor' : 'Add Vendor'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? 'Update vendor details.' : 'Register a new service vendor.'}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Identity */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={1} title="Vendor Identity" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor Code">
              <Input value={form.vendorCode} onChange={(e) => set('vendorCode', e.target.value)} placeholder="Auto-generated" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Vendor Name" required className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ramesh Plumbing Works" />
            </Field>
            <Field label="Category" required>
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Rating">
              <div className="pt-1">
                <StarPicker value={form.rating} onChange={(v) => set('rating', v)} />
              </div>
            </Field>
          </div>
        </div>

        {/* 2. Contact */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={2} title="Contact Details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required>
              <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="vendor@email.com" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Full address" />
            </Field>
          </div>
        </div>

        {/* 3. Tax & Banking */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={3} title="Tax & Banking" desc="For invoicing and payments" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GST Number">
              <Input value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} placeholder="e.g. 27AAACR5055K1ZY" />
            </Field>
            <Field label="Bank Name">
              <Input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
            </Field>
            <Field label="Account Number">
              <Input value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} placeholder="Account number" />
            </Field>
            <Field label="IFSC Code">
              <Input value={form.ifscCode} onChange={(e) => set('ifscCode', e.target.value)} placeholder="e.g. HDFC0001234" />
            </Field>
          </div>
        </div>

        {/* 4. Notes */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={4} title="Notes & Remarks" />
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Service areas, specialities, payment terms…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
          />
        </div>

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
            {saving ? 'Saving…' : isEdit ? 'Update Vendor' : 'Add Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
}
