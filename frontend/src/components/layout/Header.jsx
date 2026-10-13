import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Search,
  Plus,
  User,
  LogOut,
  Settings,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';
import Button from '../common/Button';
import SearchInput from '../common/SearchInput';

export function Header({
  pageTitle = 'Dashboard Overview',
  breadcrumb = ['Municipality', 'Overview'],
  setIsMobileOpen,
  currentUser,
  onLogout,
  onQuickAction,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: '18 Permits Expiring in 14 Days',
      time: '12m ago',
      unread: true,
      type: 'warning',
    },
    {
      id: 2,
      title: 'Wire transfer payment received ($1,250.00)',
      time: '45m ago',
      unread: true,
      type: 'success',
    },
    {
      id: 3,
      title: 'New Zoning Variance Petition submitted',
      time: '2h ago',
      unread: false,
      type: 'info',
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Mobile trigger & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
          title="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-normal">
            {breadcrumb.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                <span>{crumb}</span>
                {idx < breadcrumb.length - 1 && (
                  <span className="text-slate-400">/</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Center & Right: Search, Notifications, Quick Action, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Global Search Bar */}
        <div className="hidden md:block w-64 lg:w-72">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search citizens, permits, ID..."
            shortcut="⌘K"
            size="sm"
          />
        </div>

        {/* Quick Action Button */}
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onQuickAction}
          className="hidden sm:inline-flex bg-[#17365D] hover:bg-[#102A43]"
        >
          New Record
        </Button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  Municipal Notifications
                </span>
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                      n.unread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'warning' && (
                        <AlertTriangle size={15} className="text-amber-500" />
                      )}
                      {n.type === 'success' && (
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      )}
                      {n.type === 'info' && (
                        <Info size={15} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 leading-snug">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-600 mt-1 block">
                        {n.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-lg bg-[#17365D] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
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

            <div className="hidden xl:block text-left">
              <span className="block text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                {currentUser?.fullName || 'Administrator'}
              </span>
              <span className="block text-[10px] text-slate-600">
                {currentUser?.role || 'ADMIN'}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser?.fullName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentUser?.email}
                </p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Shield size={10} className="mr-1" />
                    Role: {currentUser?.role || 'ADMIN'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <User size={15} className="text-slate-400" />
                  Administrator Profile
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Settings size={15} className="text-slate-400" />
                  System Preferences
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
