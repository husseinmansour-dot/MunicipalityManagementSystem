import React from 'react';
import { Search, X } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  shortcut = null,
  onClear,
  size = 'md',
}) {
  const sizeClasses = {
    sm: 'py-1.5 pl-8 pr-7 text-xs',
    md: 'py-2 pl-9 pr-8 text-sm',
    lg: 'py-2.5 pl-10 pr-9 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={iconSizes[size] || 16}
        className="absolute left-3 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:bg-white focus:outline-none focus:border-[#17365D] focus:ring-2 focus:ring-[#17365D]/10 ${sizeClasses[size] || sizeClasses.md}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else onChange('');
          }}
          className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
        >
          <X size={14} />
        </button>
      )}
      {!value && shortcut && (
        <span className="absolute right-2.5 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 rounded border border-slate-300/60 pointer-events-none">
          {shortcut}
        </span>
      )}
    </div>
  );
}

export default SearchInput;
