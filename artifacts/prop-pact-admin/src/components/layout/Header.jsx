import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUnreadNotificationCount } from '../../hooks/useNotifications.js';
import NotificationDropdown from '../notifications/NotificationDropdown.jsx';

const routeLabels = {
  '/admin': 'Dashboard',
  '/admin/properties': 'Properties',
  '/admin/projects': 'Projects',
  '/admin/users': 'Users',
  '/admin/dealers': 'Dealers',
  '/admin/verification': 'Verification Requests',
  '/admin/legal': 'Legal Requests',
  '/admin/rent': 'Rent',
  '/admin/notifications': 'Notifications',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
};

function getFormattedDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getInitials(email) {
  if (!email) return 'AD';
  const parts = email.split('@')[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Header({ onMenuClick }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [profileOpen, setProfileOpen]   = useState(false);
  const [notifOpen,   setNotifOpen]     = useState(false);

  const unreadCount  = useUnreadNotificationCount();
  const pageTitle    = routeLabels[location.pathname] ?? 'Admin';
  const initials     = getInitials(currentUser?.email);
  const displayEmail = currentUser?.email ?? 'admin@proppact.com';

  const closeNotif = useCallback(() => setNotifOpen(false), []);

  return (
    <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-6 flex-shrink-0">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-800 truncate">{pageTitle}</h1>
        <p className="hidden sm:block text-xs text-gray-400 leading-none mt-0.5">
          PropPact Admin Panel
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 h-9 w-52 lg:w-64 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400 focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <Search className="h-3.5 w-3.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
          />
        </div>

        {/* Date */}
        <div className="hidden lg:flex items-center gap-1.5 h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-500 whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 text-orange-400" />
          {getFormattedDate()}
        </div>

        {/* Notification bell + dropdown */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            className={[
              'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
              notifOpen
                ? 'bg-orange-50 border-orange-200 text-orange-500'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500',
            ].join(' ')}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-0.5 text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationDropdown onClose={closeNotif} />}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 hover:bg-orange-50 hover:border-orange-200 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[11px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-none">
              <p className="text-xs font-semibold text-gray-700">Admin</p>
              <p className="text-[10px] text-gray-400 truncate max-w-28">{displayEmail}</p>
            </div>
            <ChevronDown className="hidden sm:block h-3 w-3 text-gray-400" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl border border-gray-100 bg-white shadow-lg shadow-gray-200/80 py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-800">Signed in as</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{displayEmail}</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                  Profile Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                  Help & Support
                </button>
                <div className="border-t border-gray-100 mt-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
