import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import Card from '../../components/common/Card';

export function StatusDistributionChart({ data }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-2.5 rounded-lg shadow-md border border-slate-200 text-xs">
          <p className="font-semibold text-slate-800">{item.name}</p>
          <p className="text-slate-500 mt-0.5">
            {item.value} requests ({((item.value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Requests by Status"
      subtitle="Current volume across processing stages"
      bodyClassName="pt-2 pb-4"
    >
      <div className="h-48 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius={52}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Central Counter */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-slate-900">{total}</span>
          <span className="text-[10px] uppercase font-semibold text-slate-600">Total</span>
        </div>
      </div>

      {/* Legend & Breakdown bars */}
      <div className="mt-3 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-700 font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{item.count}</span>
              <span className="text-slate-600 text-[11px] w-12 text-right">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default StatusDistributionChart;
