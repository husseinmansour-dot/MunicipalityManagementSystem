import { useCallback, useEffect, useState } from "react";
import { Wallet, FileText, CheckCircle, Clock, RefreshCw, Plus, Eye } from "lucide-react";
import api from "../api/axios";
import AddInvoiceModal from "../components/AddInvoiceModal";
import ViewInvoiceModal from "../components/ViewInvoiceModal";
import PaymentsPanel from "../components/PaymentsPanel";
import FinancialReportsPanel from "../components/FinancialReportsPanel";

const formatMoney = (value) => Number(value ?? 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "—";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [statistics, setStatistics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const loadFinance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsResponse, invoicesResponse] = await Promise.all([
        api.get("/invoices/statistics"),
        api.get("/invoices", {
          params: { page, limit: 10, ...(status ? { status } : {}) },
        }),
      ]);
      setStatistics(statsResponse.data);
      setInvoices(invoicesResponse.data.data ?? []);
      setTotalPages(invoicesResponse.data.pagination?.totalPages ?? 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load finance data.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { loadFinance(); }, [loadFinance]);

  const handleCreated = () => {
    setStatus("");
    setPage(1);
    // If already on page 1 with no filter, refresh immediately.
    if (page === 1 && status === "") loadFinance();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finance Management</h1>
          <p className="mt-2 text-sm text-slate-500">Invoices and municipal collections</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "invoices" && <button type="button" onClick={loadFinance} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            <RefreshCw size={16} /> Refresh
          </button>}
          {activeTab === "invoices" && <button type="button" onClick={() => setShowAddInvoice(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus size={18} /> Create Invoice
          </button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button type="button" onClick={() => setActiveTab("invoices")}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium ${activeTab === "invoices" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>Invoices</button>
        <button type="button" onClick={() => setActiveTab("payments")}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium ${activeTab === "payments" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>Payments</button>
        <button type="button" onClick={() => setActiveTab("reports")}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium ${activeTab === "reports" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>Financial Reports</button>
      </div>
      {activeTab === "payments" && <PaymentsPanel />}
      {activeTab === "reports" && <FinancialReportsPanel />}
      <div className={activeTab === "invoices" ? "contents" : "hidden"}>
      {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Invoices", value: statistics?.totalInvoices ?? "—", icon: FileText },
          { label: "Paid Invoices", value: statistics?.paidInvoices ?? "—", icon: CheckCircle },
          { label: "Unpaid Invoices", value: statistics?.unpaidInvoices ?? "—", icon: Clock },
          { label: "Total Billed", value: statistics ? formatMoney(statistics.totalBilled) : "—", icon: Wallet },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div>
              <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-800">{value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="font-semibold text-slate-800">All Invoices</h2>
          <select aria-label="Filter invoices by status" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500">
            <option value="">All Invoices</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-slate-100 bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                {["ID", "Citizen", "Description", "Amount", "Issue Date", "Due Date", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-6 py-4 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">#{invoice.id}</td>
                  <td className="px-6 py-4 text-slate-600">{invoice.citizen ? `${invoice.citizen.firstName} ${invoice.citizen.lastName}` : "—"}</td>
                  <td className="px-6 py-4 text-slate-600">{invoice.description}</td>
                  <td className="px-6 py-4 text-slate-600">{formatMoney(invoice.amount)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(invoice.issueDate)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(invoice.dueDate)}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${invoice.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <button type="button" onClick={() => setSelectedInvoiceId(invoice.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-500">No invoices found.</td></tr>
              )}
              {loading && invoices.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-500">Loading invoices…</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60">Previous</button>
          <span className="text-sm font-medium text-slate-600">Page {page} of {Math.max(totalPages, 1)}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60">Next</button>
        </div>
      </div>

      </div>
      {showAddInvoice && (
        <AddInvoiceModal onClose={() => setShowAddInvoice(false)} onCreated={handleCreated} />
      )}
      {selectedInvoiceId !== null && (
        <ViewInvoiceModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)}
          onPaymentRecorded={loadFinance} />
      )}
    </div>
  );
}
