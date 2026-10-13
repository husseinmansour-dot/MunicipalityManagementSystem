import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Eye, CreditCard, Wallet, Banknote, Landmark } from "lucide-react";
import api from "../api/axios";
import PaymentReceiptModal from "./PaymentReceiptModal";

const money = (value) => Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PaymentsPanel() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptId, setReceiptId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listResponse, statsResponse] = await Promise.all([
        api.get("/payments", { params: { page, limit: 10, ...(method ? { paymentMethod: method } : {}) } }),
        api.get("/payments/statistics"),
      ]);
      setPayments(listResponse.data.data ?? []);
      setTotalPages(listResponse.data.pagination?.totalPages ?? 0);
      setStats(statsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [page, method]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Payments", stats?.totalPayments ?? "—", CreditCard],
          ["Total Collected", stats ? money(stats.totalAmount) : "—", Wallet],
          ["Cash Collected", stats ? money(stats.byPaymentMethod?.CASH?.totalAmount) : "—", Banknote],
          ["Card / Bank", stats ? money(Number(stats.byPaymentMethod?.CARD?.totalAmount ?? 0) + Number(stats.byPaymentMethod?.BANK_TRANSFER?.totalAmount ?? 0)) : "—", Landmark],
        ].map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div>
              <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-800">{value}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-800">Payments</h2>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Filter payments by method" value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500">
              <option value="">All Methods</option><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank Transfer</option><option value="CARD">Card</option>
            </select>
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw size={17} /> Refresh</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-slate-100 bg-slate-50"><tr>{["Payment ID", "Invoice", "Amount", "Method", "Reference", "Payment Date", "Actions"].map((heading) => <th key={heading} className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr></thead>
            <tbody>
              {payments.map((payment) => <tr key={payment.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-600">#{payment.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">#{payment.invoiceId} <span className="block text-xs text-slate-500">{payment.invoice?.description ?? ""}</span></td>
                <td className="px-6 py-4 text-sm text-slate-600">{money(payment.amount)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{payment.paymentMethod?.replaceAll("_", " ")}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{payment.transactionReference || "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600"><button type="button" onClick={() => setReceiptId(payment.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"><Eye size={16} /> Receipt</button></td>
              </tr>)}
              {!loading && payments.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500">No payments found.</td></tr>}
              {loading && payments.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500">Loading payments…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {Math.max(totalPages, 1)}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60">Next</button>
        </div>
      </div>
      {receiptId !== null && <PaymentReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />}
    </div>
  );
}
