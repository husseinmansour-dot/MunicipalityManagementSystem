import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileCheck,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Landmark,
  ExternalLink,
} from 'lucide-react';

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  currentUser,
  onLogout,
}) {
  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Citizens',
      path: '/citizens',
      icon: Users,
      badge: '18.4k',
    },
    {
      label: 'Requests',
      path: '/requests',
      icon: ClipboardList,
      badge: '48',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      label: 'Permits',
      path: '/permits',
      icon: FileCheck,
      badge: '18',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      label: 'Finance & Billing',
      path: '/finance',
      icon: Receipt,
      badge: null,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: BarChart3,
      badge: null,
    },
    {
      label: 'Users & Roles',
      path: '/users',
      icon: ShieldCheck,
      badge: null,
      adminOnly: true,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#102A43] text-slate-200 border-r border-[#17365D] transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Logo section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#17365D]/80 bg-[#0B1B2B]/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-[#17365D] flex items-center justify-center text-white shadow-md shadow-black/20 shrink-0 border border-blue-400/30">
              <Landmark size={22} className="text-white" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-wide text-white uppercase font-sans">
                  Municipality
                </span>
                <span className="text-[11px] text-blue-200/70 font-medium truncate">
                  Admin System
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-[#17365D] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#17365D]/70 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={19}
                  className="shrink-0 transition-transform group-hover:scale-105"
                />

                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                      item.badgeColor || 'bg-slate-700/60 text-slate-300 border-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Floating tooltip on collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#0B1B2B] text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-slate-700">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* System Status / Quick Info Pill (when not collapsed) */}
        {!isCollapsed && (
          <div className="px-4 py-3 mx-3 mb-3 bg-[#0B1B2B]/60 rounded-lg border border-[#17365D]/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">System Status</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>
            <div className="text-[11px] text-slate-400/80 truncate">
              Express API • MySQL • Node.js
            </div>
          </div>
        )}

        {/* User profile & logout footer */}
        <div className="p-3 border-t border-[#17365D]/80 bg-[#0B1B2B]/40">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser?.fullName?.[0] || 'A'}</span>
                )}
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {currentUser?.fullName || 'Administrator'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                      {currentUser?.role || 'ADMIN'}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[10px] text-slate-400 truncate">
                      Municipality
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
