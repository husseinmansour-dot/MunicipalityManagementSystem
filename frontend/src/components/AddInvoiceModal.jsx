import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";

export default function AddInvoiceModal({ onClose, onCreated }) {
  const [citizens, setCitizens] = useState([]);
  const [form, setForm] = useState({ citizenId: "", description: "", amount: "", dueDate: "" });
  const [loadingCitizens, setLoadingCitizens] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCitizens() {
      try {
        // Load available citizens from the existing paginated API.
        const first = await api.get("/citizens", { params: { page: 1, limit: 100 } });
        const firstData = first.data;
        const collected = Array.isArray(firstData) ? firstData : (firstData.data ?? firstData.citizens ?? []);
        const totalPages = Math.min(firstData.pagination?.totalPages ?? 1, 100);
        for (let page = 2; page <= totalPages; page++) {
          const result = await api.get("/citizens", { params: { page, limit: 100 } });
          collected.push(...(result.data.data ?? result.data.citizens ?? []));
        }
        if (active) setCitizens(collected);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to load citizens.");
      } finally {
        if (active) setLoadingCitizens(false);
      }
    }
    loadCitizens();
    return () => { active = false; };
  }, []);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.citizenId) return setError("Select a citizen.");
    if (!form.description.trim()) return setError("Enter an invoice description.");
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount) || Number(form.amount) <= 0) {
      return setError("Enter a positive amount with up to two decimal places.");
    }
    if (!form.dueDate) return setError("Choose a due date.");
    setSaving(true);
    try {
      await api.post("/invoices", {
        citizenId: Number(form.citizenId),
        description: form.description.trim(),
        amount: form.amount,
        dueDate: form.dueDate,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="add-invoice-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="add-invoice-title" className="text-xl font-semibold">Create Invoice</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">Citizen
            <select name="citizenId" value={form.citizenId} onChange={change} disabled={loadingCitizens} required className="mt-1 w-full rounded-lg border p-2">
              <option value="">{loadingCitizens ? "Loading citizens..." : "Select a citizen"}</option>
              {citizens.map((citizen) => <option key={citizen.id} value={citizen.id}>{citizen.firstName} {citizen.lastName} (#{citizen.id})</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Description
            <textarea name="description" value={form.description} onChange={change} required rows={3} className="mt-1 w-full rounded-lg border p-2" placeholder="e.g. Building permit fee" />
          </label>
          <label className="block text-sm font-medium">Amount
            <input name="amount" value={form.amount} onChange={change} required inputMode="decimal" placeholder="150.00" className="mt-1 w-full rounded-lg border p-2" />
          </label>
          <label className="block text-sm font-medium">Due date
            <input type="date" name="dueDate" value={form.dueDate} onChange={change} required min={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-lg border p-2" />
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
            <button type="submit" disabled={saving || loadingCitizens} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? "Creating..." : "Create Invoice"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
