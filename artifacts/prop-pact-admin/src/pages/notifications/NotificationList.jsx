import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Trash2, KeyRound, MessageSquareWarning,
  Wrench, Scale, CreditCard, HardHat, Clock, Filter,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';
import { markAsRead, markAllAsRead, deleteNotification, TYPE_META, seedSampleNotifications } from '../../services/notificationService.js';

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP = {
  KeyRound            : KeyRound,
  MessageSquareWarning: MessageSquareWarning,
  Wrench              : Wrench,
  Scale               : Scale,
  CreditCard          : CreditCard,
  HardHat             : HardHat,
  Bell                : Bell,
};

const COLOR_MAP = {
  orange: 'bg-orange-50 text-orange-500 border-orange-100',
  red   : 'bg-red-50    text-red-500    border-red-100',
  blue  : 'bg-blue-50   text-blue-500   border-blue-100',
  purple: 'bg-purple-50 text-purple-500 border-purple-100',
  green : 'bg-green-50  text-green-500  border-green-100',
  amber : 'bg-amber-50  text-amber-600  border-amber-100',
  gray  : 'bg-gray-50   text-gray-400   border-gray-100',
};

function fmtTime(v) {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TYPE_OPTS = [
  { value: 'all',                   label: 'All Types' },
  { value: 'rent_reminder',         label: 'Rent Reminders' },
  { value: 'complaint_update',      label: 'Complaint Updates' },
  { value: 'maintenance_update',    label: 'Maintenance Updates' },
  { value: 'legal_reminder',        label: 'Legal Reminders' },
  { value: 'subscription_reminder', label: 'Subscription Reminders' },
  { value: 'vendor_status',         label: 'Vendor Updates' },
  { value: 'general',               label: 'General' },
];

const READ_OPTS = [
  { value: 'all',    label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read',   label: 'Read' },
];

// ── Notification item ─────────────────────────────────────────────────────────

function NotifItem({ notif, onNavigate }) {
  const meta = TYPE_META[notif.type] || TYPE_META.general;
  const Icon = ICON_MAP[meta.icon] || Bell;
  const colorCls = COLOR_MAP[meta.color] || COLOR_MAP.gray;

  async function handleRead(e) {
    e.stopPropagation();
    if (!notif.read) await markAsRead(notif.id);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    await deleteNotification(notif.id);
  }

  function handleClick() {
    if (!notif.read) markAsRead(notif.id);
    if (notif.relatedPath) onNavigate(notif.relatedPath);
  }

  return (
    <div
      onClick={handleClick}
      className={[
        'group flex items-start gap-3.5 rounded-xl border p-4 transition-all cursor-pointer',
        notif.read
          ? 'border-gray-100 bg-white hover:border-gray-200'
          : 'border-orange-100 bg-orange-50/40 hover:border-orange-200',
      ].join(' ')}
    >
      {/* Icon */}
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${colorCls}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold truncate ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                {notif.title}
              </p>
              {!notif.read && (
                <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notif.body}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notif.read && (
              <button
                onClick={handleRead}
                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                title="Mark as read"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${colorCls}`}>
            {meta.label}
          </span>
          {notif.relatedModule && (
            <span className="text-[10px] text-gray-400">{notif.relatedModule}</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="h-3 w-3" />
            {fmtTime(notif.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NotificationList() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [seeding,    setSeeding]    = useState(false);

  const { notifications, loading, error } = useNotifications({ typeFilter, readFilter });

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkAll() {
    setMarkingAll(true);
    try { await markAllAsRead(); } finally { setMarkingAll(false); }
  }

  async function handleSeed() {
    setSeeding(true);
    try { await seedSampleNotifications(); } finally { setSeeding(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
          {notifications.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-60"
            >
              <Bell className="h-4 w-4" />
              {seeding ? 'Adding…' : 'Add sample notifications'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Filter:</span>
        </div>
        {/* Read filter */}
        <div className="flex gap-1">
          {READ_OPTS.map((o) => (
            <button
              key={o.value}
              onClick={() => setReadFilter(o.value)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                readFilter === o.value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600',
              ].join(' ')}
            >
              {o.label}
            </button>
          ))}
        </div>
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 outline-none focus:border-orange-400 sm:ml-auto"
        >
          {TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load notifications: {error.message}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-gray-100 bg-white animate-pulse shadow-sm" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No notifications</p>
          <p className="text-xs text-gray-400 mt-1">
            {readFilter !== 'all' || typeFilter !== 'all' ? 'Try clearing your filters.' : 'Notifications will appear here when actions occur.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotifItem key={n.id} notif={n} onNavigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}
