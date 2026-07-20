import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, X,
  KeyRound, MessageSquareWarning, Wrench, Scale, CreditCard, HardHat,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';
import { markAsRead, markAllAsRead, TYPE_META } from '../../services/notificationService.js';

// ── Icon / colour maps (mirror notificationService meta) ─────────────────────

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
  const d    = v?.toDate ? v.toDate() : new Date(v);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ── Single row ────────────────────────────────────────────────────────────────

function DropdownItem({ notif, onClose }) {
  const navigate = useNavigate();
  const meta     = TYPE_META[notif.type] || TYPE_META.general;
  const Icon     = ICON_MAP[meta.icon]   || Bell;
  const colorCls = COLOR_MAP[meta.color] || COLOR_MAP.gray;

  function handleClick() {
    if (!notif.read) markAsRead(notif.id);
    if (notif.relatedPath) {
      navigate(notif.relatedPath);
      onClose();
    }
  }

  return (
    <button
      onClick={handleClick}
      className={[
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
        notif.read
          ? 'hover:bg-gray-50'
          : 'bg-orange-50/60 hover:bg-orange-50',
      ].join(' ')}
    >
      {/* icon */}
      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${colorCls}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-snug truncate ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>
          {notif.title}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-400 line-clamp-2">
          {notif.body}
        </p>
      </div>

      {/* time + unread dot */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] text-gray-400 whitespace-nowrap">{fmtTime(notif.createdAt)}</span>
        {!notif.read && (
          <span className="h-2 w-2 rounded-full bg-orange-500" />
        )}
      </div>
    </button>
  );
}

// ── Dropdown panel ────────────────────────────────────────────────────────────

export default function NotificationDropdown({ onClose }) {
  const navigate = useNavigate();
  const ref      = useRef(null);
  const { notifications, loading } = useNotifications({ readFilter: 'all' });

  // Show only latest 8 in dropdown
  const preview  = notifications.slice(0, 8);
  const unread   = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  async function handleMarkAllRead() {
    await markAllAsRead();
  }

  function handleViewAll() {
    navigate('/admin/notifications');
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-gray-800">Notifications</span>
          {unread > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-orange-600 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              All read
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-2.5 w-full bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : preview.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">No notifications yet</p>
          </div>
        ) : (
          preview.map((n) => (
            <DropdownItem key={n.id} notif={n} onClose={onClose} />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2.5">
          <button
            onClick={handleViewAll}
            className="w-full rounded-lg py-2 text-center text-xs font-semibold text-orange-500 hover:bg-orange-50 transition-colors"
          >
            View all notifications →
          </button>
        </div>
      )}
    </div>
  );
}
