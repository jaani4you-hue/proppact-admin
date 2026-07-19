import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { updateVendorStatus } from '../../services/vendorService.js';

const ACTIONS = [
  {
    status : 'Approved',
    label  : 'Approve Vendor',
    desc   : 'Mark this vendor as verified and approved for work assignments.',
    icon   : CheckCircle2,
    color  : 'bg-green-500 hover:bg-green-600',
    requireReason: false,
  },
  {
    status : 'Rejected',
    label  : 'Reject Vendor',
    desc   : 'Reject this vendor registration. A reason is required.',
    icon   : XCircle,
    color  : 'bg-red-500 hover:bg-red-600',
    requireReason: true,
  },
  {
    status : 'Suspended',
    label  : 'Suspend Vendor',
    desc   : 'Temporarily suspend the vendor from work assignments.',
    icon   : AlertTriangle,
    color  : 'bg-orange-500 hover:bg-orange-600',
    requireReason: true,
  },
];

export default function VendorVerificationDialog({ vendor, onClose, onUpdated }) {
  const [selected, setSelected] = useState(null);
  const [reason,   setReason]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  async function handleConfirm() {
    if (!selected) return;
    if (selected.requireReason && !reason.trim()) {
      setError('A reason is required for this action.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateVendorStatus(vendor.id, selected.status, reason.trim());
      onUpdated?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update vendor status.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">Vendor Verification</h3>
            <p className="text-xs text-gray-500 mt-0.5">{vendor.name} · {vendor.vendorCode}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Action choices */}
          <div className="space-y-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isActive = selected?.status === action.status;
              return (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => { setSelected(action); setReason(''); setError(null); }}
                  className={[
                    'w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
                    isActive
                      ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-200'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    action.status === 'Approved'  ? 'text-green-500' :
                    action.status === 'Rejected'  ? 'text-red-500'   :
                    'text-orange-500'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reason field */}
          {selected && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason / Remarks
                {selected.requireReason && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={selected.requireReason ? 'Provide a reason…' : 'Optional remarks…'}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selected || saving}
              className={[
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50',
                selected ? selected.color : 'bg-gray-300',
              ].join(' ')}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : selected ? selected.label : 'Select Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
