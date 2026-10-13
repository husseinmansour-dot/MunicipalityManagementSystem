import { useEffect, useState } from "react";
import { ClipboardCheck, RefreshCw, Plus, Eye, Pencil, CalendarDays, History } from "lucide-react";
import api from "../api/axios";
import AddPermitModal from "../components/AddPermitModal";
import ViewPermitModal from "../components/ViewPermitModal";
import UpdatePermitStatusModal from "../components/UpdatePermitStatusModal";
import SetPermitExpiryModal from "../components/SetPermitExpiryModal";
import RenewPermitModal from "../components/RenewPermitModal";
import PermitRenewalHistoryModal from "../components/PermitRenewalHistoryModal";
import PermitExpiryMonitoring from "../components/PermitExpiryMonitoring";
import { getPermitExpiryStatus } from "../utils/permitExpiry";
export default function Permits() {
  const [permits, setPermits] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [expiryCounts, setExpiryCounts] = useState({ expired: null, expiringSoon: null });
  const [expiryError, setExpiryError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPermits, setTotalPermits] = useState(0);
  const [showAddPermit, setShowAddPermit] = useState(false);
  const [selectedPermitId, setSelectedPermitId] = useState(null);
  const [permitToUpdate, setPermitToUpdate] = useState(null);
  const [permitForExpiry, setPermitForExpiry] = useState(null);
  const [permitForRenewal, setPermitForRenewal] = useState(null);
  const [permitForHistory, setPermitForHistory] = useState(null);
  const permitsPerPage = 5;
  function extractList(response) {
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.permits)) return data.permits;
    return null;
  }
  async function fetchExpiryCounts() {
    try {
      const [expiredResponse, soonResponse] = await Promise.all([
        api.get("/permits/expired"),
        api.get("/permits/expiring-soon"),
      ]);
      const expired = extractList(expiredResponse);
      const soon = extractList(soonResponse);
      if (!expired || !soon) throw new Error("Unexpected expiry response format");
      setExpiryCounts({ expired: expired.length, expiringSoon: soon.length });
      setExpiryError("");
    } catch {
      setExpiryCounts({ expired: null, expiringSoon: null });
      setExpiryError("Expiry counters unavailable. Try Refresh.");
    }
  }
  async function fetchPermits() {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: currentPage,
        limit: permitsPerPage,
      };
      if (filterStatus !== "ALL") {
        params.status = filterStatus;
      }
      const [permitsResponse, statisticsResponse] =
        await Promise.all([
          api.get("/permits", { params }),
          api.get("/permits/statistics"),
        ]);
      setPermits(permitsResponse.data.data || []);
      const pagination = permitsResponse.data.pagination;
      setTotalPages(Math.max(1, pagination?.totalPages || 1));
      setTotalPermits(pagination?.total || 0);
      setStatistics(statisticsResponse.data);
      await fetchExpiryCounts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load permits."
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchPermits();
  }, [currentPage, filterStatus]);
  function formatType(value) {
    return value ? value.replaceAll("_", " ") : "—";
  }
  function formatDate(value) {
    return value
      ? new Date(value).toLocaleDateString()
      : "—";
  }
  function statusClass(status) {
    switch (status) {
      case "APPROVED":
        return "bg-green-50 text-green-700";
      case "PENDING":
        return "bg-amber-50 text-amber-700";
      case "REJECTED":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }
  async function handleCreated() {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      await fetchPermits();
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Permits Management
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Track and manage municipality permit applications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddPermit(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          New Permit
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Total Permits", statistics.total],
          ["Pending", statistics.pending],
          ["Approved", statistics.approved],
          ["Rejected", statistics.rejected],
          ["Expired", expiryCounts.expired ?? "—"],
          ["Expiring Soon", expiryCounts.expiringSoon ?? "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <ClipboardCheck size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <h3 className="text-2xl font-bold text-slate-800">
                  {value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
      {expiryError && <p className="text-sm text-amber-700">{expiryError}</p>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 p-5">
          <h3 className="font-semibold text-slate-800">
            All Permits
          </h3>
          <button
            type="button"
            onClick={fetchPermits}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        <div className="px-5 pb-5">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full max-w-xs rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-y border-slate-100 bg-slate-50">
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Citizen</th>
                <th className="px-6 py-4">Permit Type</th>
                <th className="px-6 py-4">Application Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Approval Date</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Expiry Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading &&
                !error &&
                permits.map((permit) => (
                  <tr
                    key={permit.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500">
                      #{permit.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {permit.citizen?.firstName || ""}{" "}
                      {permit.citizen?.lastName || ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatType(permit.type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(permit.applicationDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold " +
                          statusClass(permit.status)
                        }
                      >
                        {formatType(permit.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(permit.approvalDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(permit.expiryDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getPermitExpiryStatus(permit).className}`}>
                        {getPermitExpiryStatus(permit).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPermitId(permit.id)}
                        title="View permit details"
                        aria-label={`View details for permit ${permit.id}`}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye size={18} />
                      </button>
                      {permit.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => setPermitToUpdate(permit)}
                          title="Approve or reject permit"
                          aria-label={`Update status for permit ${permit.id}`}
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {permit.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => setPermitForExpiry(permit)}
                          title="Set permit expiry date"
                          aria-label={`Set expiry date for permit ${permit.id}`}
                          className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                        >
                          <CalendarDays size={18} />
                        </button>
                      )}
                      {permit.status === "APPROVED" && permit.expiryDate && (
                        <button
                          type="button"
                          onClick={() => setPermitForRenewal(permit)}
                          title="Renew permit"
                          aria-label={`Renew permit ${permit.id}`}
                          className="rounded-lg p-2 text-teal-600 hover:bg-teal-50"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPermitForHistory(permit)}
                        title="View renewal history"
                        aria-label={`View renewal history for permit ${permit.id}`}
                        className="rounded-lg p-2 text-violet-600 hover:bg-violet-50"
                      >
                        <History size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {loading && (
            <p className="py-12 text-center text-slate-500">
              Loading permits...
            </p>
          )}
          {!loading && error && (
            <p className="py-12 text-center text-red-600">
              {error}
            </p>
          )}
          {!loading && !error && permits.length === 0 && (
            <p className="py-12 text-center text-slate-500">
              No permits found.
            </p>
          )}
        </div>
        {!loading && !error && totalPermits > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Showing{" "}
              {(currentPage - 1) * permitsPerPage + 1}–
              {Math.min(
                currentPage * permitsPerPage,
                totalPermits
              )}{" "}
              of {totalPermits} permits
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1)
                  )
                }
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      <PermitExpiryMonitoring />
      {selectedPermitId !== null && (
        <ViewPermitModal
          permitId={selectedPermitId}
          onClose={() => setSelectedPermitId(null)}
        />
      )}
      {permitToUpdate && (
        <UpdatePermitStatusModal
          permit={permitToUpdate}
          onClose={() => setPermitToUpdate(null)}
          onUpdated={fetchPermits}
        />
      )}
      {permitForExpiry && (
        <SetPermitExpiryModal
          permit={permitForExpiry}
          onClose={() => setPermitForExpiry(null)}
          onUpdated={fetchPermits}
        />
      )}
      {permitForRenewal && (
        <RenewPermitModal
          permit={permitForRenewal}
          onClose={() => setPermitForRenewal(null)}
          onRenewed={fetchPermits}
        />
      )}
      {permitForHistory && (
        <PermitRenewalHistoryModal
          permit={permitForHistory}
          onClose={() => setPermitForHistory(null)}
        />
      )}
      {showAddPermit && (
        <AddPermitModal
          onClose={() => setShowAddPermit(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}


