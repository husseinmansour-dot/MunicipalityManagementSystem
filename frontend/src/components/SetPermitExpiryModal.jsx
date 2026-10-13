
import { useState } from "react";
import { X, CalendarDays } from "lucide-react";
import api from "../api/axios";

export default function SetPermitExpiryModal({
  permit,
  onClose,
  onUpdated,
}) {
  const [expiryDate, setExpiryDate] = useState(
    permit.expiryDate
      ? new Date(permit.expiryDate).toISOString().slice(0, 10)
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const approvalDate = permit.approvalDate
    ? new Date(permit.approvalDate).toISOString().slice(0, 10)
    : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!expiryDate) {
      setError("Please select an expiry date.");
      return;
    }

    if (approvalDate && expiryDate <= approvalDate) {
      setError("Expiry date must be after the approval date.");
      return;
    }

    setLoading(true);

    try {
      await api.put(`/permits/${permit.id}/expiry`, {
        expiryDate,
      });

      await onUpdated();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update permit expiry date."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <CalendarDays size={22} />
            Set Permit Expiry
          </h2>

          <button type="button" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="mb-5 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-800">
            Permit #{permit.id}
          </p>
          <p className="mt-1 text-slate-500">
            {permit.citizen?.firstName}{" "}
            {permit.citizen?.lastName}
          </p>
          <p className="mt-2 text-slate-500">
            Approved: {approvalDate || "—"}
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Expiry Date
            </label>

            <input
              type="date"
              required
              value={expiryDate}
              min={approvalDate || undefined}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            />
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
              disabled={loading || !expiryDate}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Expiry Date"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
