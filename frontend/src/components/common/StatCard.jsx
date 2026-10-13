import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  isPositive = true,
  timeframe,
  subtext,
  iconColor = 'navy', // 'navy' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple'
  accentBar = false,
  className = '',
  onClick,
}) {
  const colorThemes = {
    navy: {
      bg: 'bg-[#17365D]/10',
      text: 'text-[#17365D]',
      accent: 'border-t-[#17365D]',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      accent: 'border-t-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      accent: 'border-t-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      accent: 'border-t-amber-600',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      accent: 'border-t-rose-600',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      accent: 'border-t-purple-600',
    },
  };

  const currentTheme = colorThemes[iconColor] || colorThemes.navy;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 relative overflow-hidden group ${
        accentBar ? `border-t-4 ${currentTheme.accent}` : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight group-hover:text-[#17365D] transition-colors">
            {value}
          </h3>
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center ${currentTheme.bg} ${currentTheme.text} transition-transform duration-200 group-hover:scale-105 shrink-0`}
          >
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {change ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-xs ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight size={13} className="mr-0.5" />
              ) : (
                <ArrowDownRight size={13} className="mr-0.5" />
              )}
              {change}
            </span>
            {timeframe && (
              <span className="text-slate-500">{timeframe}</span>
            )}
          </div>
        ) : (
          <span className="text-slate-500">{timeframe || 'Current Period'}</span>
        )}

        {subtext && (
          <span className="text-slate-400 font-medium truncate max-w-[130px]" title={subtext}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
