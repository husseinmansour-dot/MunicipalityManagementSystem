
import { useEffect, useState } from "react";
import { X, Pencil } from "lucide-react";
import api from "../api/axios";

const emptyForm = {
  firstName: "",
  lastName: "",
  nationalId: "",
  dateOfBirth: "",
  phoneNumber: "",
  address: ""
};

function EditCitizenModal({ citizenId, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCitizen() {
      try {
        const response = await api.get(`/citizens/${citizenId}`, {
          signal: controller.signal
        });

        const citizen = response.data;

        setForm({
          firstName: citizen.firstName || "",
          lastName: citizen.lastName || "",
          nationalId: citizen.nationalId || "",
          dateOfBirth: citizen.dateOfBirth
            ? citizen.dateOfBirth.slice(0, 10)
            : "",
          phoneNumber: citizen.phoneNumber || "",
          address: citizen.address || ""
        });
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err.response?.data?.message ||
          "Failed to load citizen information."
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.put(`/citizens/${citizenId}`, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nationalId: form.nationalId.trim(),
        dateOfBirth: form.dateOfBirth,
        phoneNumber: form.phoneNumber.trim() || null,
        address: form.address.trim() || null
      });

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to update citizen."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-citizen-title"
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Pencil size={22} />
            </div>

            <div>
              <h2
                id="edit-citizen-title"
                className="text-lg font-bold text-slate-800"
              >
                Edit Citizen
              </h2>

              <p className="text-sm text-slate-500">
                Update citizen information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-center py-8 text-slate-500">
              Loading citizen information...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["firstName", "First Name", "text"],
                  ["lastName", "Last Name", "text"],
                  ["nationalId", "National ID", "text"],
                  ["dateOfBirth", "Date of Birth", "date"],
                  ["phoneNumber", "Phone Number", "tel"]
                ].map(([name, label, type]) => (
                  <div key={name} className="space-y-2">
                    <label
                      htmlFor={`edit-${name}`}
                      className="block text-sm font-medium text-slate-700"
                    >
                      {label}
                      {["firstName", "lastName", "nationalId", "dateOfBirth"].includes(name) && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>

                    <input
                      id={`edit-${name}`}
                      name={name}
                      type={type}
                      value={form[name]}
                      onChange={handleChange}
                      required={["firstName", "lastName", "nationalId", "dateOfBirth"].includes(name)}
                      max={name === "dateOfBirth"
                        ? new Date().toISOString().slice(0, 10)
                        : undefined}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-address"
                  className="block text-sm font-medium text-slate-700"
                >
                  Address
                </label>

                <textarea
                  id="edit-address"
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || Boolean(error && !form.firstName)}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditCitizenModal;
