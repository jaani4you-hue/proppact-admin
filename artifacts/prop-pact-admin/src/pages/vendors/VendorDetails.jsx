import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin, Star,
  Building2, CreditCard, ClipboardList, HardHat,
  BadgeCheck, ShieldCheck, Wrench, IndianRupee, AlertCircle,
} from 'lucide-react';
import { subscribeToVendorById } from '../../services/vendorService.js';
import { useVendorWorkHistory } from '../../hooks/useVendorWorkHistory.js';
import { useVendorPayments } from '../../hooks/useVendorPayments.js';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge.jsx';
import VendorVerificationDialog from '../../components/vendors/VendorVerificationDialog.jsx';
import VendorPaymentDialog from '../../components/vendors/VendorPaymentDialog.jsx';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtCurrency(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right text-gray-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
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

const JOB_STATUS_COLORS = {
  Pending    : 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Completed  : 'bg-green-50 text-green-700 border-green-200',
  Cancelled  : 'bg-gray-50 text-gray-500 border-gray-200',
};

const PAY_STATUS_COLORS = {
  Paid   : 'bg-green-50 text-green-700 border-green-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed : 'bg-red-50 text-red-700 border-red-200',
};

// ── Tabs ─────────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
        active
          ? 'border-orange-500 text-orange-600'
          : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── Work History Tab ──────────────────────────────────────────────────────────

function WorkHistoryTab({ vendorId, onViewRequest }) {
  const { jobs, loading, error } = useVendorWorkHistory(vendorId);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      Failed to load work history: {error.message}
    </div>
  );

  if (jobs.length === 0) return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
      <Wrench className="h-8 w-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-400">No work orders assigned yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Jobs',   value: jobs.length },
          { label: 'Completed',    value: jobs.filter((j) => j.status === 'Completed').length },
          { label: 'In Progress',  value: jobs.filter((j) => j.status === 'In Progress').length },
          { label: 'Total Cost',   value: fmtCurrency(jobs.reduce((s, j) => s + (Number(j.actualCost) || Number(j.estimatedCost) || 0), 0)) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {['Work Order', 'Title', 'Property', 'Status', 'Cost', 'Date'].map((h) => (
                <th key={h} className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
                onClick={() => onViewRequest(job.id)}
              >
                <td className="py-3 px-4 font-mono text-xs text-orange-500">{job.maintenanceNumber || '—'}</td>
                <td className="py-3 px-4 font-medium text-gray-800 max-w-[180px] truncate">{job.title || '—'}</td>
                <td className="py-3 px-4 text-xs text-gray-500 max-w-[120px] truncate">{job.propertyName || '—'}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${JOB_STATUS_COLORS[job.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {job.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">
                  {job.actualCost ? fmtCurrency(job.actualCost) : job.estimatedCost ? fmtCurrency(job.estimatedCost) : '—'}
                </td>
                <td className="py-3 px-4 text-xs text-gray-500">{fmtDate(job.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Payment History Tab ───────────────────────────────────────────────────────

function PaymentHistoryTab({ vendor }) {
  const { payments, loading, error } = useVendorPayments(vendor.id);
  const [showDialog, setShowDialog] = useState(false);

  const totalPaid = payments
    .filter((p) => p.status === 'Paid')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      Failed to load payment history: {error.message}
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Summary + add */}
        <div className="flex items-center justify-between">
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-green-600">Total Paid</p>
            <p className="text-xl font-bold text-green-700">{fmtCurrency(totalPaid)}</p>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
          >
            <IndianRupee className="h-4 w-4" />
            Record Payment
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
            <IndianRupee className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-400">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Date', 'Amount', 'Mode', 'Reference', 'Description', 'Status'].map((h) => (
                    <th key={h} className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-3 px-4 text-xs text-gray-500">{p.date || fmtDate(p.createdAt)}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{fmtCurrency(p.amount)}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{p.mode || '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.reference || '—'}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 max-w-[160px] truncate">{p.description || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PAY_STATUS_COLORS[p.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDialog && (
        <VendorPaymentDialog
          vendor={vendor}
          onClose={() => setShowDialog(false)}
          onAdded={() => setShowDialog(false)}
        />
      )}
    </>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({ vendor }) {
  return (
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

      {/* KYC */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">KYC Documents</h3>
        </div>
        <InfoRow label="Aadhaar" value={vendor.aadhaarNumber ? `XXXX XXXX ${vendor.aadhaarNumber.toString().slice(-4)}` : null} mono />
        <InfoRow label="PAN"     value={vendor.panNumber} mono />
      </div>

      {/* Tax & Banking */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-blue-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tax & Banking</h3>
        </div>
        <InfoRow label="GST No."      value={vendor.gstNumber} mono />
        <InfoRow label="Bank"         value={vendor.bankName} />
        <InfoRow label="Account No."  value={vendor.accountNumber ? `****${vendor.accountNumber.toString().slice(-4)}` : null} mono />
        <InfoRow label="IFSC"         value={vendor.ifscCode} mono />
      </div>

      {/* Details */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <HardHat className="h-4 w-4 text-orange-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Details</h3>
        </div>
        <InfoRow label="Category" value={vendor.category} />
        <InfoRow label="Status"   value={vendor.status} />
        {vendor.statusReason && <InfoRow label="Status Reason" value={vendor.statusReason} />}
        <InfoRow label="Created"  value={fmtDate(vendor.createdAt)} />
        <InfoRow label="Updated"  value={fmtDate(vendor.updatedAt)} />
      </div>

      {/* Notes */}
      {vendor.notes && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
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
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function VendorDetails() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const [vendor,   setVendor]  = useState(null);
  const [loading,  setLoading] = useState(true);
  const [tab,      setTab]     = useState('profile');
  const [showVerif, setShowVerif] = useState(false);

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
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{vendor.name}</h1>
                  {vendor.status === 'Approved' && (
                    <BadgeCheck className="h-5 w-5 text-green-500" title="Verified & Approved" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-orange-500 font-semibold">{vendor.vendorCode}</span>
                  <span className="text-gray-300">·</span>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">{vendor.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <VendorStatusBadge status={vendor.status} />
          <button
            onClick={() => setShowVerif(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Verify
          </button>
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
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-4">
        <StarDisplay rating={vendor.rating} />
        {vendor.status === 'Approved' && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Verified Vendor
          </span>
        )}
      </div>

      {/* Status reason alert */}
      {vendor.statusReason && vendor.status !== 'Approved' && (
        <div className={`rounded-lg border px-4 py-3 text-sm flex items-start gap-2 ${
          vendor.status === 'Rejected'  ? 'border-red-200 bg-red-50 text-red-700' :
          vendor.status === 'Suspended' ? 'border-orange-200 bg-orange-50 text-orange-700' :
          'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{vendor.status} reason: </span>
            {vendor.statusReason}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex gap-0 border-b border-gray-100 px-2 overflow-x-auto">
          <TabBtn active={tab === 'profile'}  onClick={() => setTab('profile')}>Profile</TabBtn>
          <TabBtn active={tab === 'work'}     onClick={() => setTab('work')}>Work History</TabBtn>
          <TabBtn active={tab === 'payments'} onClick={() => setTab('payments')}>Payments</TabBtn>
        </div>
        <div className="p-5">
          {tab === 'profile'  && <ProfileTab vendor={vendor} />}
          {tab === 'work'     && <WorkHistoryTab vendorId={id} onViewRequest={(reqId) => navigate(`/admin/maintenance/${reqId}`)} />}
          {tab === 'payments' && <PaymentHistoryTab vendor={vendor} />}
        </div>
      </div>

      {showVerif && (
        <VendorVerificationDialog
          vendor={vendor}
          onClose={() => setShowVerif(false)}
          onUpdated={() => setShowVerif(false)}
        />
      )}
    </div>
  );
}
