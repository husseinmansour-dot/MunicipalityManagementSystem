
import { TrendingUp, TrendingDown } from "lucide-react";

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color = "blue",
  trend = "up"
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600"
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>

      <h3 className="text-3xl font-bold text-slate-800 mt-4">
        {value}
      </h3>

      <div className="flex items-center gap-2 mt-4">
        {trend === "up" ? (
          <TrendingUp size={16} className="text-green-600" />
        ) : (
          <TrendingDown size={16} className="text-red-600" />
        )}

        <span
          className={`text-sm font-semibold ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {change}
        </span>

        <span className="text-xs text-slate-400">
          vs. last month
        </span>
      </div>
    </div>
  );
}

export default StatCard;
