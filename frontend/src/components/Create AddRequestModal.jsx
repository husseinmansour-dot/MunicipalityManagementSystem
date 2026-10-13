
import { useEffect, useState } from "react";
import { X, ClipboardPlus } from "lucide-react";
import api from "../api/axios";

const requestTypes = [
  "RESIDENCY_CERTIFICATE",
  "BIRTH_CERTIFICATE",
  "MARRIAGE_CERTIFICATE",
  "COMPLAINT",
  "STREET_REPAIR",
  "GARBAGE_COLLECTION",
  "OTHER"
];

function AddRequestModal({ onClose, onCreated }) {
  const [citizens, setCitizens] = useState([]);
  const [citizenId, setCitizenId] = useState("");
  const [type, setType] = useState("");
  const [loadingCitizens, setLoadingCitizens] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCitizens() {
      try {
        const response = await api.get("/citizens", {
          params: { page: 1, limit: 100 }
        });

        const data = response.data;

        setCitizens(
          Array.isArray(data)
            ? data
            : data.citizens || data.data || []
        );
      } catch (err) {
        setError("Failed to load citizens.");
      } finally {
        setLoadingCitizens(false);
      }
    }

    loadCitizens();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!citizenId || !type) {
      setError("Please select a citizen and request type.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/requests", {
        citizenId: Number(citizenId),
        type
      });

      await onCreated();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to create request."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <ClipboardPlus size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                New Request
              </h2>
              <p className="text-sm text-slate-500">
                Register a municipality service request
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Citizen
            </label>

            <select
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value)}
              disabled={loadingCitizens || saving}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 outline-none"
              required
            >
              <option value="">
                {loadingCitizens
                  ? "Loading citizens..."
                  : "Select a citizen"}
              </option>

              {citizens.map((citizen) => (
                <option key={citizen.id} value={citizen.id}>
                  {citizen.firstName} {citizen.lastName}
                  {" "}— ID #{citizen.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Request Type
            </label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select request type</option>

              {requestTypes.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loadingCitizens || citizens.length === 0}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRequestModal;
