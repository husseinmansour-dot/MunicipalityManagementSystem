
import { useEffect, useState } from "react";
import { X, UserRound } from "lucide-react";
import api from "../api/axios";

function ViewCitizenModal({ citizenId, onClose }) {
  const [citizen, setCitizen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCitizen() {
      try {
        const response = await api.get(
          `/citizens/${citizenId}`,
          { signal: controller.signal }
        );

        setCitizen(response.data);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err.response?.data?.message ||
          "Failed to load citizen details."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCitizen();

    return () => controller.abort();
  }, [citizenId]);

  const details = citizen
    ? [
        ["First Name", citizen.firstName],
        ["Last Name", citizen.lastName],
        ["National ID", citizen.nationalId],
        [
          "Date of Birth",
          citizen.dateOfBirth
            ? citizen.dateOfBirth.slice(0, 10)
            : "—"
        ],
        ["Phone Number", citizen.phoneNumber || "—"],
        ["Address", citizen.address || "—"]
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-citizen-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <UserRound size={22} />
            </div>

            <div>
              <h2
                id="view-citizen-title"
                className="text-lg font-bold text-slate-800"
              >
                Citizen Details
              </h2>
              <p className="text-sm text-slate-500">
                Registered citizen information
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <p className="text-center text-slate-500 py-8">
              Loading citizen details...
            </p>
          )}

          {!loading && error && (
            <p role="alert" className="text-center text-red-600 py-8">
              {error}
            </p>
          )}

          {!loading && citizen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {details.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-slate-400 mb-2">
                    {label}
                  </p>

                  <p className="text-sm font-semibold text-slate-800 break-words">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewCitizenModal;
