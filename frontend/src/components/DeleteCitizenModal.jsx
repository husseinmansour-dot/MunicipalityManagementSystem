
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import api from "../api/axios";

function DeleteCitizenModal({ citizen, onClose, onSuccess }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      await api.delete(`/citizens/${citizen.id}`);
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to delete citizen."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-citizen-title"
        aria-describedby="delete-citizen-description"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between p-6">
          <div className="rounded-xl bg-red-50 p-3 text-red-600">
            <AlertTriangle size={24} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <h2
            id="delete-citizen-title"
            className="text-xl font-bold text-slate-800"
          >
            Delete Citizen?
          </h2>

          <p
            id="delete-citizen-description"
            className="mt-3 text-sm leading-6 text-slate-500"
          >
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-800">
              {citizen.firstName} {citizen.lastName}
            </span>
            ?
          </p>

          <p className="mt-2 text-sm font-medium text-red-600">
            This action cannot be undone.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Citizen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteCitizenModal;
