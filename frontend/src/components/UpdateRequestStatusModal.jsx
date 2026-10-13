
import { useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";

const transitions = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: []
};

function UpdateRequestStatusModal({ request, onClose, onUpdated }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!request) return null;

  const allowedStatuses = transitions[request.status] || [];

  async function handleSubmit(e) {
    e.preventDefault();

    if (!status) {
      setError("Please select a status.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.put(`/requests/${request.id}/status`, {
        status
      });

      await onUpdated();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to update request status."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Update Request #{request.id}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Current status: {request.status}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              New Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading || allowedStatuses.length === 0}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Select a status</option>

              {allowedStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {allowedStatuses.length === 0 && (
            <p className="text-sm text-amber-600">
              This request has reached a final status.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || allowedStatuses.length === 0}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateRequestStatusModal;
