import React from 'react';

/**
 * Enterprise StatusBadge component for consistent municipality entity states.
 */
export function StatusBadge({ status, size = 'md', className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  // Color mapping based on standard enterprise states
  const configs = {
    // Request & Permit statuses
    PENDING: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Pending Review',
    },
    APPROVED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Approved',
    },
    COMPLETED: {
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      dot: 'bg-teal-500',
      label: 'Completed',
    },
    REJECTED: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      label: 'Rejected',
    },

    // Invoice statuses
    PAID: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Paid',
    },
    UNPAID: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Unpaid',
    },
    OVERDUE: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      label: 'Overdue',
    },

    // Permit validity
    ACTIVE: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Active',
    },
    EXPIRED: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
      label: 'Expired',
    },

    // Payment methods
    BANK_TRANSFER: {
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
      label: 'Bank Transfer',
    },
    CARD: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500',
      label: 'Card Payment',
    },
    CASH: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
      label: 'Cash Desk',
    },

    // Roles
    ADMIN: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      dot: 'bg-purple-600',
      label: 'Admin',
    },
    EMPLOYEE: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dot: 'bg-blue-600',
      label: 'Municipal Staff',
    },
    CITIZEN: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
      label: 'Citizen',
    },

    // Urgency
    URGENT: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-600',
      label: 'Urgent',
    },
    HIGH: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      label: 'High Priority',
    },
    NORMAL: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      label: 'Normal',
    },
  };

  const config = configs[normalized] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: status,
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
export default StatusBadge;
