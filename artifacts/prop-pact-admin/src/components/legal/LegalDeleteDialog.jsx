import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { deleteLegalCase } from '../../services/legalService.js';

export default function LegalDeleteDialog({ legalCase, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  if (!legalCase) return null;

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await deleteLegalCase(legalCase.id);
      onDeleted?.();
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to delete');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pt-4 pb-5">
          <h3 className="text-base font-semibold text-gray-900">Delete Legal Case?</h3>
          <p className="mt-1 text-sm text-gray-500">
            This will permanently delete{' '}
            <span className="font-medium text-gray-700">
              {legalCase.title || legalCase.caseNumber}
            </span>{' '}
            and all its uploaded documents and evidence from Storage.
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
        <div className="flex gap-2.5 border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <><Trash2 className="h-4 w-4" /> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
