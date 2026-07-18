import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin, Star,
  Building2, CreditCard, ClipboardList, HardHat,
} from 'lucide-react';
import { subscribeToVendorById } from '../../services/vendorService.js';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge.jsx';

function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-medium text-right text-gray-800">{value || '—'}</span>
    </div>
  );
}

function StarDisplay({ rating }) {
  const n = Number(rating) || 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${s <= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="ml-1 text-sm font-semibold text-gray-700">{n > 0 ? `${n}/5` : 'Not rated'}</span>
    </div>
  );
}

export default function VendorDetails() {
  const navigate     = useNavigate();
  const { id }       = useParams();
  const [vendor,     setVendor]  = useState(null);
  const [loading,    setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToVendorById(id, ({ vendor: v }) => {
      setVendor(v);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-lg font-semibold">Vendor not found.</p>
        <button onClick={() => navigate('/admin/vendors')} className="mt-3 text-sm text-orange-500 hover:underline">
          ← Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/admin/vendors')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold flex-shrink-0">
                {(vendor.name || 'V')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{vendor.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-orange-500 font-semibold">{vendor.vendorCode}</span>
                  <span className="text-gray-300">·</span>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">{vendor.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <VendorStatusBadge status={vendor.status} />
          <button
            onClick={() => navigate(`/admin/vendors/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Rating */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <StarDisplay rating={vendor.rating} />
      </div>

      {/* Cards grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Contact */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="h-4 w-4 text-orange-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contact</h3>
          </div>
          {vendor.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <Phone className="h-3.5 w-3.5 text-gray-400" />{vendor.phone}
            </div>
          )}
          {vendor.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <Mail className="h-3.5 w-3.5 text-gray-400" />{vendor.email}
            </div>
          )}
          {vendor.address && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />{vendor.address}
            </div>
          )}
          {!vendor.phone && !vendor.email && !vendor.address && (
            <p className="text-sm text-gray-400">No contact details.</p>
          )}
        </div>

        {/* Tax & Banking */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-blue-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tax & Banking</h3>
          </div>
          <InfoRow label="GST No."      value={vendor.gstNumber} />
          <InfoRow label="Bank"         value={vendor.bankName} />
          <InfoRow label="Account No."  value={vendor.accountNumber} />
          <InfoRow label="IFSC"         value={vendor.ifscCode} />
        </div>

        {/* Details */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HardHat className="h-4 w-4 text-orange-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Details</h3>
          </div>
          <InfoRow label="Category" value={vendor.category} />
          <InfoRow label="Status"   value={vendor.status} />
          <InfoRow label="Created"  value={fmtDate(vendor.createdAt)} />
          <InfoRow label="Updated"  value={fmtDate(vendor.updatedAt)} />
        </div>

        {/* Notes */}
        {vendor.notes && (
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</h3>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
              <p className="text-xs text-gray-700 leading-relaxed">{vendor.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Link to maintenance */}
      <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-orange-800">Maintenance Requests</p>
          <p className="text-xs text-orange-600 mt-0.5">View all work orders assigned to this vendor</p>
        </div>
        <button
          onClick={() => navigate('/admin/maintenance')}
          className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          View Requests →
        </button>
      </div>
    </div>
  );
}
