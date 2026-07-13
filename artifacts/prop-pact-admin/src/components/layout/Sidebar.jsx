import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  Users,
  Handshake,
  ShieldCheck,
  Scale,
  KeyRound,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  X,
  HomeIcon,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase.js';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Building2,       label: 'Properties', path: '/admin/properties' },
  { icon: FolderOpen,      label: 'Projects',   path: '/admin/projects' },
  { icon: Users,           label: 'Users',      path: '/admin/users' },
  { icon: Handshake,       label: 'Dealers',    path: '/admin/dealers' },
  {
    icon: ShieldCheck,
    label: 'Verification Requests',
    path: '/admin/verification',
    badge: 23,
  },
  {
    icon: Scale,
    label: 'Legal Requests',
    path: '/admin/legal',
    badge: 8,
  },
  { icon: KeyRound,  label: 'Rent',          path: '/admin/rent' },
  { icon: Bell,      label: 'Notifications', path: '/admin/notifications', badge: 5 },
  { icon: BarChart3, label: 'Reports',       path: '/admin/reports' },
  { icon: Settings,  label: 'Settings',      path: '/admin/settings' },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#141824] transition-transform duration-300',
          'lg:relative lg:translate-x-0 lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
              <HomeIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white leading-none">PropPact</span>
              <span className="block text-[10px] text-orange-400 font-medium tracking-widest uppercase">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation label */}
        <div className="px-5 pt-5 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Main Menu
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {navItems.map(({ icon: Icon, label, path, badge }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-900/30'
                    : 'text-gray-400 hover:bg-white/8 hover:text-white',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={[
                      'h-4 w-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-orange-400',
                    ].join(' ')}
                  />
                  <span className="flex-1 truncate">{label}</span>
                  {badge !== undefined && (
                    <span
                      className={[
                        'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-orange-500/20 text-orange-400',
                      ].join(' ')}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-white/10" />

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-500/15 hover:text-red-400 transition-all duration-150 group"
          >
            <LogOut className="h-4 w-4 flex-shrink-0 text-gray-500 group-hover:text-red-400 transition-colors" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
