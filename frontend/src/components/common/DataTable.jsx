import React from 'react';
import EmptyState from './EmptyState';
import { Loader2 } from 'lucide-react';

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display at this time.',
  onRowClick,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin text-[#17365D] mb-2" size={28} />
        <span className="text-xs font-medium">Loading records...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.headerClassName || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors duration-150 ${
                onRowClick
                  ? 'cursor-pointer hover:bg-slate-50/90'
                  : 'hover:bg-slate-50/50'
              }`}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={`py-3.5 px-4 text-slate-700 align-middle ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.cellClassName || ''}`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
