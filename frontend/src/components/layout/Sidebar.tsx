import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Link2, Star, FolderTree, Share2, Clock, Archive, Trash2, Settings, Brain, X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/links', label: 'All Links', icon: Link2 },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/collections', label: 'Collections', icon: FolderTree },
  { to: '/graph', label: 'Graph', icon: Share2 },
  { to: '/read-later', label: 'Read Later', icon: Clock },
  { to: '/archive', label: 'Archive', icon: Archive },
  { to: '/trash', label: 'Trash', icon: Trash2 },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] shrink-0 flex-col border-r border-white/[0.06] bg-base-900/95 backdrop-blur-xl transition-transform duration-300 ease-out',
          'lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 lg:bg-base-900/60',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-2.5 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-cyan-400 shadow-glow">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">BrainVault</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/[0.06] lg:hidden">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => clsx('sidebar-link', isActive && 'sidebar-link-active')}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => clsx('sidebar-link', isActive && 'sidebar-link-active')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
          <div className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: user?.avatarColor || '#8b5cf6' }}
            >
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{user?.name}</p>
              <button onClick={logout} className="text-xs text-slate-500 hover:text-red-400">
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
