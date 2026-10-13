
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Temporary sample data
const revenueData = [
  { month: "May", revenue: 5200 },
  { month: "Jun", revenue: 7800 },
  { month: "Jul", revenue: 6500 },
  { month: "Aug", revenue: 10200 },
  { month: "Sep", revenue: 8900 },
  { month: "Oct", revenue: 12500 }
];

const requestsData = [
  { name: "Pending", value: 128 },
  { name: "Approved", value: 245 },
  { name: "Rejected", value: 42 },
  { name: "In Progress", value: 85 }
];

const COLORS = [
  "#F59E0B",
  "#16A34A",
  "#DC2626",
  "#2563EB"
];

function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">

      {/* Monthly Revenue */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 xl:col-span-2 min-w-0">
        <h3 className="text-lg font-semibold text-slate-800">
          Monthly Revenue
        </h3>

        <p className="text-sm text-slate-400 mt-1">
          Revenue collected over the last six months
        </p>

        <div className="h-72 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />

              <XAxis dataKey="month" tickLine={false} axisLine={false} />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />

              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]} />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={3}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Requests by Status */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-w-0">
        <h3 className="text-lg font-semibold text-slate-800">
          Requests by Status
        </h3>

        <p className="text-sm text-slate-400 mt-1">
          Distribution of municipal requests
        </p>

        <div className="h-72 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={requestsData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {requestsData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>

              <Tooltip />

              <Legend
                verticalAlign="bottom"
                height={36}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default DashboardCharts;
