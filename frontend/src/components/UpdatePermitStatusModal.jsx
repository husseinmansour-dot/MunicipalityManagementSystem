
import { useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";

export default function UpdatePermitStatusModal({
  permit,
  onClose,
  onUpdated,
}) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!status) {
      setError("Please select a status.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.put(`/permits/${permit.id}/status`, {
        status,
      });

      await onUpdated();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update permit status."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Update Permit Status
          </h2>

          <button type="button" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <p className="mb-5 text-sm text-slate-500">
          Permit #{permit.id} —{" "}
          {permit.citizen?.firstName}{" "}
          {permit.citizen?.lastName}
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              New Status
            </label>

            <select
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            >
              <option value="">Select status</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !status}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
