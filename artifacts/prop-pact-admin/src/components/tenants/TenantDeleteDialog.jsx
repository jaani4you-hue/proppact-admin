import { AlertTriangle, Loader2 } from 'lucide-react';

export default function TenantDeleteDialog({ tenant, loading, onConfirm, onCancel }) {
  if (!tenant) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-xl border border-gray-100 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-center text-base font-semibold text-gray-800 mb-1">Delete Tenant</h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-700">{tenant.fullName}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
