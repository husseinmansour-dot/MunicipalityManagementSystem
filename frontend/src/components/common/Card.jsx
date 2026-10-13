import React from 'react';

export function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footer,
  hoverable = false,
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-slate-300' : ''
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={`p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 rounded-b-xl text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
