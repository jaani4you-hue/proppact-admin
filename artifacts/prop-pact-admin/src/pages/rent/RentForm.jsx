import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { createRent, updateRent, getRentById } from '../../services/rentService.js';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'NEFT', 'RTGS'];
const PROPERTY_TYPES  = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Penthouse', 'Studio', 'Row House'];

const EMPTY = {
  tenantName     : '',
  tenantId       : '',
  ownerName      : '',
  ownerId        : '',
  propertyName   : '',
  propertyId     : '',
  propertyAddress: '',
  propertyType   : '',
  monthlyRent    : '',
  securityDeposit: '',
  lateFee        : '',
  dueDay         : '1',
  paidAmount     : '0',
  leaseStartDate : '',
  leaseEndDate   : '',
  preferredPaymentMethod: 'Bank Transfer',
  notes          : '',
};

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
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

function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

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

export default function RentForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getRentById(id).then((r) => {
      if (r) {
        setForm({
          ...EMPTY,
          ...r,
          monthlyRent    : String(r.monthlyRent     ?? ''),
          securityDeposit: String(r.securityDeposit ?? ''),
          lateFee        : String(r.lateFee         ?? ''),
          paidAmount     : String(r.paidAmount      ?? '0'),
          dueDay         : String(r.dueDay          ?? '1'),
        });
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.tenantName.trim())  return setError('Tenant name is required.');
    if (!form.propertyName.trim())return setError('Property name is required.');
    if (!form.monthlyRent)        return setError('Monthly rent is required.');

    const data = {
      ...form,
      monthlyRent    : Number(form.monthlyRent)     || 0,
      securityDeposit: Number(form.securityDeposit) || 0,
      lateFee        : Number(form.lateFee)         || 0,
      paidAmount     : Number(form.paidAmount)      || 0,
      dueDay         : Number(form.dueDay)          || 1,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateRent(id, data);
        navigate(`/admin/rent/${id}`);
      } else {
        const newId = await createRent(data);
        navigate(`/admin/rent/${newId}`);
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
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
            {isEdit ? 'Edit Rent Record' : 'New Rent Record'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit ? 'Update the rent details below.' : 'Fill in the details to create a new rent record.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── 1. Tenant Information ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={1} title="Tenant Information" desc="Who is renting this property?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tenant Name" required>
              <Input
                placeholder="Full name"
                value={form.tenantName}
                onChange={(e) => set('tenantName', e.target.value)}
              />
            </Field>
            <Field label="Tenant ID (Firestore)" hint="Optional — paste the tenant's document ID">
              <Input
                placeholder="e.g. abc123xyz"
                value={form.tenantId}
                onChange={(e) => set('tenantId', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── 2. Owner Information ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={2} title="Owner Information" desc="Who owns this property?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner Name">
              <Input
                placeholder="Full name"
                value={form.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
              />
            </Field>
            <Field label="Owner ID (Firestore)" hint="Optional — paste the owner's document ID">
              <Input
                placeholder="e.g. owner123"
                value={form.ownerId}
                onChange={(e) => set('ownerId', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── 3. Property Information ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={3} title="Property Information" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Property Name" required>
              <Input
                placeholder="e.g. Sunrise Apartment 3B"
                value={form.propertyName}
                onChange={(e) => set('propertyName', e.target.value)}
              />
            </Field>
            <Field label="Property ID (Firestore)" hint="Optional">
              <Input
                placeholder="e.g. prop456"
                value={form.propertyId}
                onChange={(e) => set('propertyId', e.target.value)}
              />
            </Field>
            <Field label="Property Address">
              <Input
                placeholder="Full address"
                value={form.propertyAddress}
                onChange={(e) => set('propertyAddress', e.target.value)}
              />
            </Field>
            <Field label="Property Type">
              <Select value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                <option value="">Select type</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
        </div>

        {/* ── 4. Rent & Financial Details ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={4} title="Rent & Financial Details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monthly Rent (₹)" required>
              <Input
                type="number" min="0" placeholder="e.g. 25000"
                value={form.monthlyRent}
                onChange={(e) => set('monthlyRent', e.target.value)}
              />
            </Field>
            <Field label="Security Deposit (₹)">
              <Input
                type="number" min="0" placeholder="e.g. 50000"
                value={form.securityDeposit}
                onChange={(e) => set('securityDeposit', e.target.value)}
              />
            </Field>
            <Field label="Late Fee (₹)" hint="Charged if rent is overdue">
              <Input
                type="number" min="0" placeholder="e.g. 500"
                value={form.lateFee}
                onChange={(e) => set('lateFee', e.target.value)}
              />
            </Field>
            <Field label="Due Day of Month" hint="Day 1–28 when rent is due">
              <Input
                type="number" min="1" max="28" placeholder="e.g. 1"
                value={form.dueDay}
                onChange={(e) => set('dueDay', e.target.value)}
              />
            </Field>
            <Field label="Amount Already Paid (₹)" hint="Pre-fill if this is an existing arrangement">
              <Input
                type="number" min="0" placeholder="0"
                value={form.paidAmount}
                onChange={(e) => set('paidAmount', e.target.value)}
              />
            </Field>
            <Field label="Preferred Payment Method">
              <Select
                value={form.preferredPaymentMethod}
                onChange={(e) => set('preferredPaymentMethod', e.target.value)}
              >
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
          </div>
        </div>

        {/* ── 5. Lease Period ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={5} title="Lease Period" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lease Start Date">
              <Input
                type="date"
                value={form.leaseStartDate}
                onChange={(e) => set('leaseStartDate', e.target.value)}
              />
            </Field>
            <Field label="Lease End Date">
              <Input
                type="date"
                value={form.leaseEndDate}
                onChange={(e) => set('leaseEndDate', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── 6. Notes ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={6} title="Notes" desc="Any special instructions or remarks" />
          <textarea
            rows={3}
            placeholder="Additional notes…"
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
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving…' : isEdit ? 'Update Record' : 'Create Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
