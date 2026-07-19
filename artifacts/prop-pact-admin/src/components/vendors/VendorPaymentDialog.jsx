import { useState } from 'react';
import { Loader2, IndianRupee, X } from 'lucide-react';
import { addVendorPayment } from '../../services/vendorService.js';

const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'NEFT', 'RTGS'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Failed'];

export default function VendorPaymentDialog({ vendor, onClose, onAdded }) {
  const [form, setForm] = useState({
    amount     : '',
    mode       : 'Bank Transfer',
    reference  : '',
    date       : new Date().toISOString().slice(0, 10),
    status     : 'Paid',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    setSaving(true);
    setError(null);
    try {
      await addVendorPayment(vendor.id, { ...form, vendorName: vendor.name });
      onAdded?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save payment.');
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Record Payment</h3>
              <p className="text-xs text-gray-500 mt-0.5">{vendor.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹) <span className="text-red-500">*</span></label>
              <input type="number" min="1" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Payment Mode</label>
              <select value={form.mode} onChange={(e) => set('mode', e.target.value)} className={inputCls}>
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Reference / UTR</label>
              <input value={form.reference} onChange={(e) => set('reference', e.target.value)}
                placeholder="Transaction ID or cheque number" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <input value={form.description} onChange={(e) => set('description', e.target.value)}
                placeholder="Payment for work order MNT-2501-XXXX" className={inputCls} />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
