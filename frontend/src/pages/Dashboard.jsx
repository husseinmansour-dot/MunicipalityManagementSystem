
import {
  Users,
  ClipboardList,
  FileCheck,
  Wallet
} from "lucide-react";

import StatCard from "../components/StatCard";
import DashboardCharts from "../components/DashboardCharts";
import RecentRequests from "../components/RecentRequests";

function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800">
          Welcome back, Administrator!
        </h2>

        <p className="text-slate-500 mt-2">
          Here's what's happening in your municipality today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Citizens"
          value="2,845"
          change="+12.5%"
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Pending Requests"
          value="128"
          change="+8.2%"
          icon={ClipboardList}
          color="orange"
        />

        <StatCard
          title="Active Permits"
          value="856"
          change="+5.4%"
          icon={FileCheck}
          color="green"
        />

        <StatCard
          title="Total Revenue"
          value="$48,250"
          change="+18.7%"
          icon={Wallet}
          color="purple"
        />
      </div>

      <DashboardCharts />

      <RecentRequests />
    </div>
  );
}

export default Dashboard;
