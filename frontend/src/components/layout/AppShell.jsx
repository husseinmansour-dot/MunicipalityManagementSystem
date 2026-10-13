import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  UserPlus,
  FilePlus2,
  FileCheck2,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

export function AppShell({
  children,
  pageTitle = 'Dashboard Overview',
  breadcrumb = ['Municipality', 'Dashboard'],
  currentUser,
  onLogout,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const quickActionItems = [
    {
      id: 'citizen',
      title: 'Register Citizen',
      description: 'Add a new citizen record to the civil registry.',
      icon: UserPlus,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'request',
      title: 'New Service Request',
      description: 'Log a municipal maintenance, zoning, or public request.',
      icon: FilePlus2,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'permit',
      title: 'Issue Permit Application',
      description: 'Submit building, commercial, or public event permit.',
      icon: FileCheck2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'payment',
      title: 'Record Fee / Payment',
      description: 'Process an invoice settlement via cash, card, or wire.',
      icon: CreditCard,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
  ];

  const handleSelectQuickAction = (item) => {
    setActionSuccess(`Quick Action triggered: "${item.title}". Integrated forms will open in Phase 2.`);
    setTimeout(() => {
      setActionSuccess(null);
      setQuickActionOpen(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <Header
          pageTitle={pageTitle}
          breadcrumb={breadcrumb}
          setIsMobileOpen={setIsMobileOpen}
          currentUser={currentUser}
          onLogout={onLogout}
          onQuickAction={() => setQuickActionOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-6 border-t border-slate-200/80 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              Municipality Management System
            </span>
            <span className="text-slate-300">|</span>
            <span>Enterprise Public Administration Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Version 2.4.0-Enterprise</span>
            <span>Prisma ORM • Express API</span>
          </div>
        </footer>
      </div>

      {/* Quick Action Modal */}
      <Modal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
        title="Administrative Quick Actions"
        subtitle="Select a municipal workflow to initiate immediately"
        maxWidth="max-w-md"
      >
        {actionSuccess ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Workflow Initialized
            </h4>
            <p className="text-xs text-slate-500 mt-1">{actionSuccess}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {quickActionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectQuickAction(item)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-3.5 transition-all text-left group"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${item.color} group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AppShell;
