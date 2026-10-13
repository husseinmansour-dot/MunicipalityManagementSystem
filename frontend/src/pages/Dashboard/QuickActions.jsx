import React from 'react';
import {
  UserPlus,
  FileText,
  FileCheck2,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

export function QuickActions({ onActionClick }) {
  const actions = [
    {
      id: 'citizen',
      title: 'Register Citizen',
      subtitle: 'Add citizen record & ID',
      icon: UserPlus,
      bg: 'bg-blue-50 hover:bg-blue-100/80',
      iconBg: 'bg-blue-600 text-white',
      border: 'border-blue-200/80',
    },
    {
      id: 'request',
      title: 'Log Service Request',
      subtitle: 'Create work or inquiry ticket',
      icon: FileText,
      bg: 'bg-amber-50 hover:bg-amber-100/80',
      iconBg: 'bg-amber-600 text-white',
      border: 'border-amber-200/80',
    },
    {
      id: 'permit',
      title: 'Issue New Permit',
      subtitle: 'Building & commercial licenses',
      icon: FileCheck2,
      bg: 'bg-emerald-50 hover:bg-emerald-100/80',
      iconBg: 'bg-emerald-600 text-white',
      border: 'border-emerald-200/80',
    },
    {
      id: 'payment',
      title: 'Record Payment',
      subtitle: 'Process invoice transaction',
      icon: CreditCard,
      bg: 'bg-purple-50 hover:bg-purple-100/80',
      iconBg: 'bg-purple-600 text-white',
      border: 'border-purple-200/80',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            type="button"
            onClick={() => onActionClick && onActionClick(act)}
            className={`p-4 rounded-xl border ${act.border} ${act.bg} text-left transition-all duration-200 flex items-center justify-between group shadow-2xs hover:shadow-sm`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${act.iconBg} group-hover:scale-105 transition-transform`}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {act.subtitle}
                </p>
              </div>
            </div>

            <ArrowRight
              size={15}
              className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
            />
          </button>
        );
      })}
    </div>
  );
}

export default QuickActions;
