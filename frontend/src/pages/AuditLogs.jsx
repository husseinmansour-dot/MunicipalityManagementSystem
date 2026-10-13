
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import {
  Activity,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Filter,
  CalendarDays,
  UserRound,
  AlertCircle,
} from "lucide-react";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "ROLE_CHANGE",
  "RENEW"
];
const MODULES = [
  "CITIZENS",
  "REQUESTS",
  "PERMITS",
  "FINANCE",
  "DOCUMENTS",
  "HR",
  "PROJECTS",
  "USERS",
  "ROLES"
];

function actionStyle(action) {
  switch (action) {
    case "CREATE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "UPDATE":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "DELETE":
      return "bg-red-50 text-red-700 border-red-200";
    case "STATUS_CHANGE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function formatDate(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/audit-logs", {
        params: {
          page,
          limit: 20,
          ...(moduleFilter ? { module: moduleFilter } : {}),
          ...(actionFilter ? { action: actionFilter } : {}),
        },
      });

      setLogs(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load audit logs. Please try again."
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const searchable = [
      log.action,
      log.module,
      log.details,
      log.entityId,
      log.user?.fullName,
      log.user?.email,
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(" ")
      .toLowerCase();

    return searchable.includes(search.toLowerCase());
  });

  const startItem =
    pagination.total === 0 ? 0 : (page - 1) * 20 + 1;
  const endItem = Math.min(page * 20, pagination.total);

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
              <ShieldCheck size={17} />
              Administration / Security
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Audit Logs
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review recorded system activities and user actions.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Matching Activities
              </span>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <Activity size={20} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {pagination.total}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Based on selected API filters
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Current Page
              </span>
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
                <Filter size={20} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {pagination.total === 0 ? 0 : page}
              <span className="ml-1 text-lg font-normal text-slate-400">
                / {pagination.totalPages}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              20 records per page
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Access Level
              </span>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <ShieldCheck size={20} />
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-slate-900">
              Administrator
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Read-only audit history
            </p>
          </div>
        </div>

        {/* Main table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Activity History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and filter recorded actions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search current page..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">All Modules</option>
                {MODULES.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>

              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">All Actions</option>
                {ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Activity</th>
                  <th className="px-5 py-4 font-semibold">Performed By</th>
                  <th className="px-5 py-4 font-semibold">Module</th>
                  <th className="px-5 py-4 font-semibold">Record</th>
                  <th className="px-5 py-4 font-semibold">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Activity
                        size={32}
                        className="mx-auto mb-3 text-slate-300"
                      />
                      <p className="font-medium text-slate-700">
                        No audit logs found
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Try changing your filters or search.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${actionStyle(
                            log.action
                          )}`}
                        >
                          {log.action?.replaceAll("_", " ")}
                        </span>
                        <p className="mt-2 max-w-xs text-xs text-slate-500">
                          {log.details || "No description"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-full bg-slate-100 p-2 text-slate-500">
                            <UserRound size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {log.user?.fullName || "Deleted / Unknown User"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {log.user?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {log.module}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700">
                          {log.entityId != null ? `#${log.entityId}` : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={15} className="text-slate-400" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing {startItem}–{endItem} of {pagination.total} records
              {search ? " (search applies to this page)" : ""}
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </button>
              <button
                disabled={loading || page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
