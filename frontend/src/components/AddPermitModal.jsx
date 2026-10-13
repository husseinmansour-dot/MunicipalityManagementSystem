
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";

export default function AddPermitModal({ onClose, onCreated }) {
  const [citizens, setCitizens] = useState([]);
  const [citizenId, setCitizenId] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCitizens, setLoadingCitizens] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCitizens() {
      try {
        const response = await api.get("/citizens", {
          params: { page: 1, limit: 100 },
        });

        const data = response.data;
        setCitizens(
          Array.isArray(data)
            ? data
            : data.citizens || data.data || []
        );
      } catch {
        setError("Unable to load citizens.");
      } finally {
        setLoadingCitizens(false);
      }
    }

    loadCitizens();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/permits", {
        citizenId: Number(citizenId),
        type,
        description: description.trim(),
      });

      await onCreated();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create permit."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            New Permit
          </h2>
          <button type="button" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Citizen
            </label>
            <select
              required
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value)}
              disabled={loadingCitizens}
              className="w-full rounded-xl border border-slate-200 p-3"
            >
              <option value="">Select citizen</option>
              {citizens.map((citizen) => (
                <option key={citizen.id} value={citizen.id}>
                  {citizen.firstName} {citizen.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Permit Type
            </label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3"
            >
              <option value="">Select permit type</option>
              <option value="CONSTRUCTION">Construction</option>
              <option value="RENOVATION">Renovation</option>
              <option value="BUSINESS_LICENSE">
                Business License
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3"
              placeholder="Enter permit description..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingCitizens || !citizenId || !type}
              className="rounded-xl bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Permit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
