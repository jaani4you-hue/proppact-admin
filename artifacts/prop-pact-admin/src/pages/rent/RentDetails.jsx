import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, IndianRupee, Calendar, User, Building2,
  Printer, Plus, X, CheckCircle2, Clock, AlertCircle, MessageSquare,
  Mail, CreditCard, Receipt, TrendingUp, FileText,
} from 'lucide-react';
import {
  subscribeToRentById,
  subscribeToPayments,
  addPayment,
  printReceipt,
} from '../../services/rentService.js';
import RentStatusBadge from '../../components/rent/RentStatusBadge.jsx';

function fmt(n)    { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className={`text-sm font-medium text-gray-800 text-right ${className}`}>{value || '—'}</span>
    </div>
  );
}

function StatPill({ label, value, color = 'gray' }) {
  const cols = {
    green : 'bg-green-50  text-green-700  border-green-100',
    red   : 'bg-red-50    text-red-700    border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    blue  : 'bg-blue-50   text-blue-700   border-blue-100',
    gray  : 'bg-gray-50   text-gray-700   border-gray-100',
  };
  return (
    <div className={`flex flex-col items-center rounded-xl border px-4 py-3 ${cols[color]}`}>
      <span className="text-[11px] uppercase font-medium opacity-70 mb-1">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

// ── Add Payment Modal ─────────────────────────────────────────────────────────
function PaymentModal({ rent, onClose, onAdded }) {
  const [form, setForm] = useState({
    amount: '',
    paymentType: 'Full',
    paymentMethod: rent?.preferredPaymentMethod || 'Cash',
    paidDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  // Auto-fill full amount
  function handleTypeChange(type) {
    set('paymentType', type);
    if (type === 'Full') set('amount', String(rent?.outstandingBalance || rent?.monthlyRent || ''));
    else if (type === 'Advance') set('amount', String(rent?.monthlyRent || ''));
    else set('amount', '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    setSaving(true);
    setError(null);
    try {
      const { receiptNumber } = await addPayment(rent.id, form);
      onAdded?.(receiptNumber);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Record Payment</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Outstanding */}
          {Number(rent?.outstandingBalance) > 0 && (
            <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 text-sm text-orange-700">
              Outstanding balance: <strong>{fmt(rent.outstandingBalance)}</strong>
            </div>
          )}

          {/* Payment type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Payment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Full', 'Partial', 'Advance'].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => handleTypeChange(t)}
                  className={[
                    'rounded-lg border py-2 text-xs font-semibold transition-colors',
                    form.paymentType === t
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600',
                  ].join(' ')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="1" placeholder="Enter amount"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'NEFT', 'RTGS'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={form.paidDate}
                onChange={(e) => set('paidDate', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea
              rows={2} placeholder="Reference number, remarks…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
              {saving
                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <CreditCard className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reminder generator ────────────────────────────────────────────────────────
function generateWhatsApp(rent) {
  return `Hi ${rent.tenantName},\n\nThis is a reminder that your rent of *${fmt(rent.monthlyRent)}* for *${rent.propertyName}* is due.\n\nOutstanding Balance: *${fmt(rent.outstandingBalance)}*\nDue Date: Day ${rent.dueDay} of every month.\n\nKindly arrange the payment at the earliest.\n\nThank you,\nPropPact Admin`;
}

function generateEmail(rent) {
  return `Subject: Rent Due Reminder — ${rent.propertyName}

Dear ${rent.tenantName},

This is a friendly reminder that your monthly rent payment is due.

Property : ${rent.propertyName}
Address  : ${rent.propertyAddress || '—'}
Rent     : ${fmt(rent.monthlyRent)}
Outstanding: ${fmt(rent.outstandingBalance)}
Due Day  : ${rent.dueDay} of every month

Please make the payment using your preferred method: ${rent.preferredPaymentMethod || 'Bank Transfer'}.

For any queries, please contact us.

Best regards,
PropPact Property Management`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RentDetails() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const [rent,      setRent]      = useState(null);
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showPay,   setShowPay]   = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied,    setCopied]    = useState('');

  useEffect(() => {
    const unsub1 = subscribeToRentById(id, ({ rent: r }) => {
      setRent(r);
      setLoading(false);
    });
    const unsub2 = subscribeToPayments(id, ({ payments: p }) => setPayments(p));
    return () => { unsub1(); unsub2(); };
  }, [id]);

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }
  if (!rent) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg font-semibold">Rent record not found.</p>
        <button onClick={() => navigate('/admin/rent')} className="mt-3 text-sm text-orange-500 hover:underline">
          ← Back to Rent List
        </button>
      </div>
    );
  }

  const TABS = ['overview', 'payments', 'reminders'];

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/rent')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900">{rent.tenantName}</h1>
              <RentStatusBadge status={rent.status} />
            </div>
            <p className="text-sm text-gray-500">{rent.propertyName || '—'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPay(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Payment
          </button>
          <button
            onClick={() => navigate(`/admin/rent/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Monthly Rent"  value={fmt(rent.monthlyRent)}       color="orange" />
        <StatPill label="Paid"          value={fmt(rent.paidAmount)}        color="green"  />
        <StatPill label="Balance"       value={fmt(rent.outstandingBalance)} color={Number(rent.outstandingBalance) > 0 ? 'red' : 'gray'} />
        <StatPill label="Security Dep." value={fmt(rent.securityDeposit)}   color="blue"   />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={[
              'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              activeTab === t
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Tenant & Owner */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              People
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold text-xs flex-shrink-0">
                  {(rent.tenantName || 'T')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{rent.tenantName || '—'}</p>
                  <p className="text-[11px] text-gray-400">Tenant</p>
                </div>
                {rent.tenantId && (
                  <button
                    onClick={() => navigate(`/admin/tenants/${rent.tenantId}`)}
                    className="ml-auto text-xs text-orange-500 hover:underline"
                  >
                    View Profile
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-xs flex-shrink-0">
                  {(rent.ownerName || 'O')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{rent.ownerName || '—'}</p>
                  <p className="text-[11px] text-gray-400">Owner</p>
                </div>
                {rent.ownerId && (
                  <button
                    onClick={() => navigate(`/admin/owners/${rent.ownerId}`)}
                    className="ml-auto text-xs text-blue-500 hover:underline"
                  >
                    View Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Property */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Property
            </h3>
            <InfoRow label="Name"    value={rent.propertyName} />
            <InfoRow label="Address" value={rent.propertyAddress} />
            <InfoRow label="Type"    value={rent.propertyType} />
            {rent.propertyId && (
              <button
                onClick={() => navigate(`/admin/properties/${rent.propertyId}`)}
                className="mt-2 text-xs text-orange-500 hover:underline"
              >
                View Property →
              </button>
            )}
          </div>

          {/* Rent Details */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Rent Details
            </h3>
            <InfoRow label="Monthly Rent"     value={fmt(rent.monthlyRent)} />
            <InfoRow label="Security Deposit" value={fmt(rent.securityDeposit)} />
            <InfoRow label="Late Fee"         value={rent.lateFee ? fmt(rent.lateFee) : 'None'} />
            <InfoRow label="Due Day"          value={rent.dueDay ? `Day ${rent.dueDay} of month` : '—'} />
            <InfoRow label="Payment Method"   value={rent.preferredPaymentMethod} />
            <InfoRow label="Last Payment"     value={fmtDate(rent.lastPaymentDate)} />
          </div>

          {/* Lease */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Lease Period
            </h3>
            <InfoRow label="Start Date" value={fmtDate(rent.leaseStartDate)} />
            <InfoRow label="End Date"   value={fmtDate(rent.leaseEndDate)} />
            <InfoRow label="Created"    value={fmtDate(rent.createdAt)} />
            <InfoRow label="Updated"    value={fmtDate(rent.updatedAt)} />
            {rent.notes && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-[11px] font-medium uppercase text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{rent.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payments Tab ── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Payment History ({payments.length})
            </h3>
            <button
              onClick={() => setShowPay(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Record Payment
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-400">
              No payments recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600 flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{fmt(p.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {p.paymentType} · {p.paymentMethod} · {fmtDate(p.paidDate)}
                      </p>
                      {p.notes && <p className="text-xs text-gray-400 mt-0.5 italic">"{p.notes}"</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-[10px] font-mono text-orange-500 font-semibold">{p.receiptNumber}</p>
                    <button
                      onClick={() => printReceipt(p)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <Printer className="h-3 w-3" />
                      Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reminders Tab ── */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          {/* Status banner */}
          <div className={[
            'flex items-center gap-3 rounded-xl border p-4',
            rent.status === 'Paid'
              ? 'bg-green-50 border-green-100 text-green-800'
              : rent.status === 'Overdue'
              ? 'bg-red-50 border-red-100 text-red-800'
              : 'bg-yellow-50 border-yellow-100 text-yellow-800',
          ].join(' ')}>
            {rent.status === 'Paid'
              ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              : rent.status === 'Overdue'
              ? <AlertCircle className="h-5 w-5 flex-shrink-0" />
              : <Clock className="h-5 w-5 flex-shrink-0" />}
            <div>
              <p className="text-sm font-semibold">{rent.status}</p>
              <p className="text-xs opacity-75">
                {rent.status === 'Paid'
                  ? `Full payment received. Outstanding: ${fmt(rent.outstandingBalance)}`
                  : `Outstanding: ${fmt(rent.outstandingBalance)}`}
              </p>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-800">WhatsApp Reminder</h3>
              </div>
              <button
                onClick={() => copy(generateWhatsApp(rent), 'wa')}
                className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
              >
                {copied === 'wa' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 rounded-lg p-3 font-sans leading-relaxed">
              {generateWhatsApp(rent)}
            </pre>
          </div>

          {/* Email */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">Email Template</h3>
              </div>
              <button
                onClick={() => copy(generateEmail(rent), 'email')}
                className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
              >
                {copied === 'email' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 rounded-lg p-3 font-sans leading-relaxed">
              {generateEmail(rent)}
            </pre>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPay && (
        <PaymentModal
          rent={rent}
          onClose={() => setShowPay(false)}
          onAdded={(rcpt) => console.log('Receipt:', rcpt)}
        />
      )}
    </div>
  );
}
