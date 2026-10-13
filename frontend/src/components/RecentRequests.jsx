
import { ArrowUpRight } from "lucide-react";

// Temporary mock data
const recentRequests = [
  {
    id: "REQ-001",
    citizen: "Ahmad Hassan",
    service: "Building Permit",
    date: "2026-10-08",
    status: "Pending"
  },
  {
    id: "REQ-002",
    citizen: "Sara Khalil",
    service: "Residence Certificate",
    date: "2026-10-07",
    status: "Approved"
  },
  {
    id: "REQ-003",
    citizen: "Omar Ali",
    service: "Road Maintenance",
    date: "2026-10-06",
    status: "In Progress"
  },
  {
    id: "REQ-004",
    citizen: "Maya Ibrahim",
    service: "Business License",
    date: "2026-10-05",
    status: "Rejected"
  }
];

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-green-50 text-green-700",
  "In Progress": "bg-blue-50 text-blue-700",
  Rejected: "bg-red-50 text-red-700"
};

function RecentRequests() {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Recent Requests
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Latest municipal service requests
          </p>
        </div>

        <span className="flex items-center gap-1 text-sm font-medium text-blue-600">
          View All
          <ArrowUpRight size={16} />
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-y border-slate-100">
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4">Request ID</th>
              <th className="px-6 py-4">Citizen</th>
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {recentRequests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                  {request.id}
                </td>

                <td className="px-6 py-4 text-sm font-medium text-slate-800">
                  {request.citizen}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {request.service}
                </td>

                <td className="px-6 py-4 text-sm text-slate-500">
                  {request.date}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[request.status] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {request.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 text-sm text-slate-400">
        Showing {recentRequests.length} recent requests
      </div>
    </section>
  );
}

export default RecentRequests;
