
import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import api from "../api/axios";

export default function RenewPermitModal({
  permit,
  onClose,
  onRenewed,
}) {
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const existingExpiry = permit.expiryDate
    ? new Date(permit.expiryDate).toISOString().slice(0, 10)
    : "";

  const today = new Date().toLocaleDateString("en-CA");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!newExpiryDate) {
      setError("Please select a new expiry date.");
      return;
    }

    if (
      newExpiryDate <= existingExpiry ||
      newExpiryDate <= today
    ) {
      setError(
        "The new expiry date must be later than the existing expiry date and today."
      );
      return;
    }

    setLoading(true);

    try {
      await api.put(`/permits/${permit.id}/renew`, {
        newExpiryDate,
      });

      await onRenewed();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to renew permit."
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
            <RefreshCw size={20} />
            Renew Permit
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
          <p className="mt-2 text-slate-600">
            Current Expiry: {existingExpiry || "—"}
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
              New Expiry Date
            </label>

            <input
              type="date"
              required
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
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
              disabled={loading || !newExpiryDate}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Renewing..." : "Renew Permit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
