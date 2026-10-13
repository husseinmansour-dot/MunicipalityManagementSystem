
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";

export default function ViewPermitModal({ permitId, onClose }) {
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPermit() {
      try {
        const response = await api.get(`/permits/${permitId}`);
        if (active) setPermit(response.data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load permit details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPermit();

    return () => {
      active = false;
    };
  }, [permitId]);

  function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : "—";
  }

  function formatType(value) {
    return value ? value.replaceAll("_", " ") : "—";
  }

  function Detail({ label, value }) {
    return (
      <div>
        <p className="text-xs font-medium uppercase text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">
          {value ?? "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Permit Details
          </h2>
          <button type="button" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {loading && (
          <p className="text-sm text-slate-500">
            Loading permit details...
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && permit && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Detail label="Permit ID" value={`#${permit.id}`} />
            <Detail
              label="Citizen"
              value={`${permit.citizen?.firstName || ""} ${permit.citizen?.lastName || ""}`}
            />
            <Detail
              label="National ID"
              value={permit.citizen?.nationalId}
            />
            <Detail
              label="Phone"
              value={permit.citizen?.phoneNumber}
            />
            <Detail
              label="Permit Type"
              value={formatType(permit.type)}
            />
            <Detail
              label="Status"
              value={formatType(permit.status)}
            />
            <Detail
              label="Application Date"
              value={formatDate(permit.applicationDate)}
            />
            <Detail
              label="Approval Date"
              value={formatDate(permit.approvalDate)}
            />
            <Detail
              label="Expiry Date"
              value={formatDate(permit.expiryDate)}
            />
            <div className="sm:col-span-2">
              <Detail
                label="Description"
                value={permit.description || "No description"}
              />
            </div>
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
