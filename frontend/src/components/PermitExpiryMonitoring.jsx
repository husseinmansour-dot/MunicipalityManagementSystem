
import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, RefreshCw } from "lucide-react";
import api from "../api/axios";

export default function PermitExpiryMonitoring() {
  const [expired, setExpired] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchMonitoring() {
    setLoading(true);
    setError("");

    try {
      const [expiredResponse, expiringResponse] = await Promise.all([
        api.get("/permits/expired"),
        api.get("/permits/expiring-soon"),
      ]);

      function extractPermits(response) {
        const data = response.data;

        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.permits)) return data.permits;

        return [];
      }

      setExpired(extractPermits(expiredResponse));
      setExpiringSoon(extractPermits(expiringResponse));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load permit expiry information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonitoring();
  }, []);

  function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : "—";
  }

  function PermitTable({ permits }) {
    if (permits.length === 0) {
      return (
        <p className="py-6 text-center text-sm text-slate-500">
          No permits found.
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Permit</th>
              <th className="px-4 py-3">Citizen</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Expiry Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {permits.map((permit) => (
              <tr key={permit.id}>
                <td className="px-4 py-3">#{permit.id}</td>
                <td className="px-4 py-3">
                  {permit.citizen?.firstName}{" "}
                  {permit.citizen?.lastName}
                </td>
                <td className="px-4 py-3">
                  {permit.type?.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-3">
                  {formatDate(permit.expiryDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Permit Expiry Monitoring
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Monitor expired permits and upcoming expirations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMonitoring}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-slate-500">
          Loading expiry information...
        </p>
      ) : !error ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-red-100 p-5">
              <AlertTriangle className="text-red-600" size={22} />
              <h4 className="font-semibold text-slate-800">
                Expired Permits ({expired.length})
              </h4>
            </div>
            <PermitTable permits={expired} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-amber-100 p-5">
              <Clock3 className="text-amber-600" size={22} />
              <h4 className="font-semibold text-slate-800">
                Expiring Soon ({expiringSoon.length})
              </h4>
            </div>
            <PermitTable permits={expiringSoon} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
