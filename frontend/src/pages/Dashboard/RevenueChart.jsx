import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Card from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

export function RevenueChart({ data }) {
  const [timeRange, setTimeRange] = useState('full-year');

  const filteredData = timeRange === 'h2' ? data.slice(6) : data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-xs">
          <p className="font-bold text-slate-800 mb-1.5">{label} 2026</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Municipal Revenue & Billings"
      subtitle="Monthly cash collection vs total invoices billed"
      action={
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#17365D]"
          >
            <option value="full-year">Full Year (12 Months)</option>
            <option value="h2">Last 6 Months (H2)</option>
          </select>
        </div>
      }
      bodyClassName="pt-2 pb-4"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickFormatter={(val) => `$${val / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />
            <Bar
              dataKey="revenue"
              name="Collected Revenue"
              fill="#17365D"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="billed"
              name="Billed Invoices"
              fill="#93C5FD"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <span className="text-slate-600 block">Avg Monthly Collection</span>
          <span className="font-bold text-slate-800 text-sm mt-0.5 block">$58,900</span>
        </div>
        <div>
          <span className="text-slate-600 block">Collection Rate</span>
          <span className="font-bold text-emerald-600 text-sm mt-0.5 block">92.4%</span>
        </div>
        <div>
          <span className="text-slate-600 block">Highest Month</span>
          <span className="font-bold text-slate-800 text-sm mt-0.5 block">December ($81.8k)</span>
        </div>
      </div>
    </Card>
  );
}

export default RevenueChart;
