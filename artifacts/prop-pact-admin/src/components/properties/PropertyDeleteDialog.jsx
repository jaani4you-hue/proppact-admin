import { Loader2, Trash2, X } from 'lucide-react';

export default function PropertyDeleteDialog({ property, loading, onConfirm, onCancel }) {
  if (!property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl p-6">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 mb-4">
          <Trash2 className="h-5 w-5 text-red-600" />
        </div>

        <h3 className="text-base font-bold text-gray-800">Delete Property?</h3>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          This will permanently delete{' '}
          <span className="font-semibold text-gray-700">
            {property.title || 'this property'}
          </span>{' '}
          and all associated images and documents. This action cannot be undone.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Deleting…</>
            ) : (
              <><Trash2 className="h-4 w-4" />Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
