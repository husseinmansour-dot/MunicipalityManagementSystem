
import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import api from "../api/axios";

export default function PermitRenewalHistoryModal({
  permit,
  onClose,
}) {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchHistory() {
      try {
        const response = await api.get(
          `/permits/${permit.id}/renewals`
        );

        const data = response.data;

        if (active) {
          setRenewals(
            Array.isArray(data)
              ? data
              : data.renewals || data.data || []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load renewal history."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchHistory();

    return () => {
      active = false;
    };
  }, [permit.id]);

  function formatDate(value) {
    return value
      ? new Date(value).toLocaleDateString()
      : "—";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <History size={22} />
              Renewal History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Permit #{permit.id} —{" "}
              {permit.citizen?.firstName}{" "}
              {permit.citizen?.lastName}
            </p>
          </div>

          <button type="button" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {loading && (
          <p className="py-8 text-center text-slate-500">
            Loading renewal history...
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && renewals.length === 0 && (
          <p className="py-8 text-center text-slate-500">
            This permit has no renewal history.
          </p>
        )}

        {!loading && !error && renewals.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Previous Expiry</th>
                  <th className="px-4 py-3">New Expiry</th>
                  <th className="px-4 py-3">Renewed On</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {renewals.map((renewal, index) => (
                  <tr key={renewal.id ?? index}>
                    <td className="px-4 py-3">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(
                        renewal.previousExpiryDate
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(
                        renewal.newExpiryDate
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(
                        renewal.renewedAt
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
