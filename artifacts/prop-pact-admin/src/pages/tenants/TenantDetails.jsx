import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Pencil, Trash2, Phone, Mail, MapPin,
  Building2, FileText, Shield, Calendar, ExternalLink,
  User, CreditCard, Home, TrendingUp, Clock,
} from 'lucide-react';
import { getTenantById, deleteTenant } from '../../services/tenantService.js';
import TenantStatusBadge, { PaymentStatusBadge, OccupancyBadge } from '../../components/tenants/TenantStatusBadge.jsx';
import TenantAvatar from '../../components/tenants/TenantAvatar.jsx';
import TenantDeleteDialog from '../../components/tenants/TenantDeleteDialog.jsx';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(val) {
  if (!val) return '—';
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return String(val); }
}

function fmtDateTime(ts) {
  if (!ts) return '—';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function fmtMoney(n) {
  if (!n && n !== 0) return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, mono = false, href }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className={`mt-0.5 text-sm text-blue-600 hover:underline break-all ${mono ? 'font-mono' : ''}`}>
            {String(value)}
          </a>
        ) : (
          <p className={`mt-0.5 text-sm text-gray-700 break-words ${mono ? 'font-mono' : ''}`}>{String(value)}</p>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-7 w-40 rounded bg-gray-200" />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="h-24 bg-gray-200" />
        <div className="px-6 pb-6 pt-4 space-y-3">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-200 flex-shrink-0 -mt-14 border-4 border-white" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-3 w-28 rounded bg-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 pt-2">
            {[1,2,3,4].map((n) => <div key={n} className="h-10 rounded bg-gray-100" />)}
          </div>
        </div>
      </div>
      {[1,2,3].map((n) => (
        <div key={n} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-gray-200" />
          {[1,2].map((m) => <div key={m} className="h-3 w-full rounded bg-gray-100" />)}
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TenantDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [tenant,        setTenant]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [notFound,      setNotFound]      = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getTenantById(id);
        if (cancelled) return;
        if (!data) setNotFound(true); else setTenant(data);
      } catch { if (!cancelled) setNotFound(true); }
      finally  { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteTenant(id);
      navigate('/admin/tenants');
    } catch (err) {
      setDeleteError(err.message ?? 'Failed to delete tenant.');
      setDeleteLoading(false);
    }
  }

  if (loading) return <Skeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          <User className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">Tenant not found</p>
        <p className="mt-1 text-xs text-gray-400">This tenant may have been deleted.</p>
        <button onClick={() => navigate('/admin/tenants')}
          className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors">
          Back to Tenants
        </button>
      </div>
    );
  }

  const namedDocs = tenant.documents?.filter((d) => d.type !== 'other') ?? [];
  const otherDocs = tenant.documents?.filter((d) => d.type === 'other') ?? [];
  const allDocs   = [...namedDocs, ...otherDocs];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/tenants')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-800">Tenant Details</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete tenant profile and lease information</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/admin/tenants/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors">
            <Pencil className="h-3.5 w-3.5" />Edit
          </button>
          <button onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />Delete
          </button>
        </div>
      </div>

      {/* Profile banner */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between gap-4 -mt-12 mb-4 flex-wrap">
            <div className="flex items-end gap-4">
              <div className="rounded-full border-4 border-white shadow-md">
                <TenantAvatar photo={tenant.photo} name={tenant.fullName} size="xl" />
              </div>
              <div className="mb-1">
                <h2 className="text-lg font-bold text-gray-800">{tenant.fullName || '—'}</h2>
                <p className="text-sm text-gray-500">{tenant.assignedProperty || tenant.city || '—'}</p>
              </div>
            </div>
            <div className="mb-1 flex items-center gap-2 flex-wrap">
              <TenantStatusBadge status={tenant.status} />
              <OccupancyBadge status={tenant.occupancyStatus} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Monthly Rent</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{fmtMoney(tenant.monthlyRent)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Security Deposit</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{fmtMoney(tenant.securityDeposit)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Payment Status</p>
              <div className="mt-0.5"><PaymentStatusBadge status={tenant.paymentStatus} /></div>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Member Since</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{fmtDate(tenant.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact */}
        <Section title="Contact Information" icon={Phone}>
          <InfoRow icon={Phone} label="Mobile"           value={tenant.mobile}          mono />
          <InfoRow icon={Phone} label="Alternate Mobile" value={tenant.alternateMobile} mono />
          <InfoRow icon={Mail}  label="Email"            value={tenant.email}
            href={tenant.email ? `mailto:${tenant.email}` : undefined} />
          <InfoRow icon={User}  label="Gender"           value={tenant.gender} />
          <InfoRow icon={Calendar} label="Date of Birth" value={fmtDate(tenant.dateOfBirth)} />
        </Section>

        {/* Identity */}
        <Section title="Identity Documents" icon={Shield}>
          <InfoRow icon={Shield} label="Aadhaar Number" value={tenant.aadhaarNumber} mono />
          <InfoRow icon={Shield} label="PAN Number"     value={tenant.panNumber}     mono />
        </Section>

        {/* Address */}
        <Section title="Current Address" icon={MapPin}>
          <InfoRow icon={MapPin} label="Address" value={tenant.currentAddress} />
          <InfoRow icon={MapPin} label="City"    value={tenant.city} />
          <InfoRow icon={MapPin} label="State"   value={tenant.state} />
          <InfoRow icon={MapPin} label="Pincode" value={tenant.pincode} mono />
        </Section>

        {/* Rental */}
        <Section title="Rental Information" icon={Home}>
          <InfoRow icon={Home}      label="Assigned Property"  value={tenant.assignedProperty} />
          <InfoRow icon={User}      label="Owner"              value={tenant.owner} />
          <InfoRow icon={Building2} label="Dealer"             value={tenant.dealer} />
          <InfoRow icon={TrendingUp} label="Monthly Rent"      value={fmtMoney(tenant.monthlyRent)} />
          <InfoRow icon={TrendingUp} label="Security Deposit"  value={fmtMoney(tenant.securityDeposit)} />
          <InfoRow icon={Clock}     label="Rent Due Date"      value={tenant.rentDueDate ? `${tenant.rentDueDate}${['th','st','nd','rd'][Math.min(tenant.rentDueDate % 10, 3) * (tenant.rentDueDate < 11 || tenant.rentDueDate > 13 ? 1 : 0)] ?? 'th'} of month` : null} />
          <InfoRow icon={Calendar}  label="Lease Start"        value={fmtDate(tenant.leaseStartDate)} />
          <InfoRow icon={Calendar}  label="Lease End"          value={fmtDate(tenant.leaseEndDate)} />
        </Section>
      </div>

      {/* Payment */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Payment Information</h3>
          <div className="ml-auto"><PaymentStatusBadge status={tenant.paymentStatus} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {[
            { label: 'Total Paid',      value: fmtMoney(tenant.totalPaid)     },
            { label: 'Pending Amount',  value: fmtMoney(tenant.pendingAmount)  },
            { label: 'Last Payment',    value: fmtDate(tenant.lastPaymentDate) },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      {allDocs.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <FileText className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Documents</h3>
            <span className="ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {allDocs.length}
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allDocs.map((doc, idx) => (
              <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40 transition-colors group">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
                  <FileText className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate group-hover:text-orange-700 transition-colors">
                    {doc.name || `Document ${idx + 1}`}
                  </p>
                  {doc.uploadedAt && (
                    <p className="text-[11px] text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-400 flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Calendar className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Record Details</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Created At</p>
            <p className="mt-1 text-sm text-gray-700">{fmtDateTime(tenant.createdAt)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Last Updated</p>
            <p className="mt-1 text-sm text-gray-700">{fmtDateTime(tenant.updatedAt)}</p>
          </div>
        </div>
      </div>

      <TenantDeleteDialog tenant={showDelete ? tenant : null} loading={deleteLoading}
        onConfirm={handleDelete} onCancel={() => { setShowDelete(false); setDeleteError(''); }} />
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-lg text-sm text-red-600">
          {deleteError}
        </div>
      )}
    </div>
  );
}
