import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#17365D] hover:bg-[#102A43] text-white focus:ring-[#17365D]/30 shadow-sm',
    accent: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-600/30 shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-300 border border-slate-200/80',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-slate-200 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-200',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/30 shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500/30 shadow-sm',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-md',
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-md',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const iconSizes = {
    xs: 13,
    sm: 14,
    md: 16,
    lg: 18,
  };

  const iconSize = iconSizes[size] || 16;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={iconSize} />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={iconSize} />
      )}

      {children && <span>{children}</span>}

      {!loading && Icon && iconPosition === 'right' && <Icon size={iconSize} />}
    </button>
  );
}

export default Button;
