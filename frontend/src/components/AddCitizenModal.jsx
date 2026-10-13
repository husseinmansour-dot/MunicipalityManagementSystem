
import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import api from "../api/axios";

const initialForm = {
  firstName: "",
  lastName: "",
  nationalId: "",
  dateOfBirth: "",
  phoneNumber: "",
  address: ""
};

function AddCitizenModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/citizens", {
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
        "Unable to create citizen. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-citizen-title"
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <UserPlus size={22} />
            </div>

            <div>
              <h2
                id="add-citizen-title"
                className="text-lg font-bold text-slate-800"
              >
                Add New Citizen
              </h2>
              <p className="text-sm text-slate-500">
                Register a new municipality citizen.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                  htmlFor={name}
                  className="block text-sm font-medium text-slate-700"
                >
                  {label}
                  {["firstName", "lastName", "nationalId", "dateOfBirth"].includes(name) && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>

                <input
                  id={name}
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  required={["firstName", "lastName", "nationalId", "dateOfBirth"].includes(name)}
                  max={name === "dateOfBirth" ? new Date().toISOString().slice(0, 10) : undefined}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-slate-700"
            >
              Address
            </label>

            <textarea
              id="address"
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Citizen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCitizenModal;
