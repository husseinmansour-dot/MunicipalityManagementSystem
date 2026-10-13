import { useEffect, useState } from "react";
import api from "../api/axios";

const money = (value) => Number(value ?? 0).toFixed(2);
const date = (value) => value ? new Date(value).toLocaleDateString() : "—";

export default function ViewInvoiceModal({ invoiceId, onClose, onPaymentRecorded }) {
  const [invoice, setInvoice] = useState(null);
  const [history, setHistory] = useState(null);
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [details, payments] = await Promise.all([
        api.get(`/invoices/${invoiceId}`),
        api.get(`/invoices/${invoiceId}/payments`),
      ]);
      setInvoice(details.data);
      setHistory(payments.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [invoiceId]);

  const recordPayment = async (event) => {
    event.preventDefault();
    if (!window.confirm("Record full payment for this invoice?")) return;
    setSaving(true);
    setError("");
    try {
      await api.put(`/invoices/${invoiceId}/pay`, {
        paymentMethod: method,
        ...(reference.trim() ? { transactionReference: reference.trim() } : {}),
      });
      await load();
      onPaymentRecorded?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Invoice details" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Invoice #{invoiceId}</h2>
          <button type="button" onClick={onClose} className="rounded border px-3 py-1">Close</button>
        </div>
        {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
        {loading ? <p>Loading invoice…</p> : invoice && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2">
              <p><strong>Citizen:</strong> {invoice.citizen ? `${invoice.citizen.firstName} ${invoice.citizen.lastName}` : "—"}</p>
              <p><strong>National ID:</strong> {invoice.citizen?.nationalId ?? "—"}</p>
              <p><strong>Description:</strong> {invoice.description}</p>
              <p><strong>Amount:</strong> {money(invoice.amount)}</p>
              <p><strong>Issued:</strong> {date(invoice.issueDate)}</p>
              <p><strong>Due:</strong> {date(invoice.dueDate)}</p>
              <p><strong>Status:</strong> {invoice.status}</p>
              <p><strong>Paid on:</strong> {date(invoice.paidDate)}</p>
            </div>
            {invoice.status === "UNPAID" && (
              <form onSubmit={recordPayment} className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Record full payment</h3>
                <label className="block text-sm">Payment method
                  <select className="mt-1 w-full rounded border p-2" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                </label>
                <label className="block text-sm">Transaction reference (optional)
                  <input className="mt-1 w-full rounded border p-2" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference number" />
                </label>
                <button disabled={saving} type="submit" className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? "Recording…" : `Record payment (${money(invoice.amount)})`}</button>
              </form>
            )}
            <div>
              <h3 className="mb-2 font-semibold">Payment history</h3>
              <p className="mb-2 text-sm text-gray-600">Total paid: {history?.summary?.totalPaid ?? "0.00"}</p>
              {history?.payments?.length ? (
                <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">ID</th><th className="p-2">Date</th><th className="p-2">Amount</th><th className="p-2">Method</th><th className="p-2">Reference</th></tr></thead><tbody>
                  {history.payments.map((p) => <tr className="border-b" key={p.id}><td className="p-2">#{p.id}</td><td className="p-2">{date(p.paymentDate)}</td><td className="p-2">{money(p.amount)}</td><td className="p-2">{p.paymentMethod}</td><td className="p-2">{p.transactionReference || "—"}</td></tr>)}
                </tbody></table></div>
              ) : <p className="text-sm text-gray-500">No payments recorded.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
