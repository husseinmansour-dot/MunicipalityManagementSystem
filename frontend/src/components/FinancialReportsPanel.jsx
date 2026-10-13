import { useState } from "react";
import { BarChart3, Download, RefreshCw, CreditCard, Wallet } from "lucide-react";
import api from "../api/axios";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const monthStart = () => `${today().slice(0, 7)}-01`;
const money = (value) => Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const methods = { CASH: "Cash", BANK_TRANSFER: "Bank Transfer", CARD: "Card" };

export default function FinancialReportsPanel() {
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(null);

  const valid = startDate && endDate && startDate <= endDate;

  const generate = async () => {
    if (!valid) { setError("Select a valid date range (start date must not be after end date)."); return; }
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await api.get("/reports/financial", { params: { startDate, endDate } });
      setReport(response.data);
      setPeriod({ startDate, endDate });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate financial report.");
      setPeriod(null);
    } finally { setLoading(false); }
  };

  const exportCSV = async () => {
    if (!valid) { setError("Select a valid date range first."); return; }
    setExporting(true);
    setError("");
    try {
      const response = await api.get("/reports/financial/export", {
        params: { startDate, endDate }, responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export financial report. Please try again.");
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-600"><BarChart3 size={22} /></span><h2 className="text-lg font-semibold text-slate-800">Financial Reports</h2></div>
        <p className="mb-4 text-sm text-slate-500">Payment collections only. Expenses are not included.</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">End date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </label>
          <button type="button" disabled={loading || !valid} onClick={generate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={17} /> {loading ? "Generating…" : "Generate Report"}
          </button>
          <button type="button" disabled={exporting || !valid} onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <Download size={17} /> {exporting ? "Exporting…" : "Download CSV"}
          </button>
        </div>
        {!valid && <p className="mt-3 text-sm text-amber-700">Please select a valid date range.</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>

      {report && (
        <>
          <p className="text-sm text-slate-500">Report period: {period.startDate} to {period.endDate}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Payments</p><p className="mt-2 text-2xl font-bold text-slate-800">{report.summary?.totalPayments ?? 0}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Collected</p><p className="mt-2 text-2xl font-bold text-slate-800">{money(report.summary?.totalCollected)}</p></div>
          </div>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h3 className="border-b border-slate-100 p-5 text-lg font-semibold text-slate-800">Collections by Payment Method</h3>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-slate-100 bg-slate-50"><tr><th className="px-6 py-4 text-sm text-slate-600">Method</th><th className="px-6 py-4 text-sm text-slate-600">Payments</th><th className="px-6 py-4 text-sm text-slate-600">Collected</th></tr></thead>
              <tbody>{Object.entries(report.byPaymentMethod ?? {}).map(([method, data]) => <tr key={method} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-6 py-4 text-sm text-slate-600">{methods[method] ?? method}</td><td className="px-6 py-4 text-sm text-slate-600">{data.count}</td><td className="px-6 py-4 text-sm text-slate-600">{money(data.totalAmount)}</td></tr>)}</tbody>
            </table></div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h3 className="border-b border-slate-100 p-5 text-lg font-semibold text-slate-800">Daily Collections</h3>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-slate-100 bg-slate-50"><tr><th className="px-6 py-4 text-sm text-slate-600">Date (UTC)</th><th className="px-6 py-4 text-sm text-slate-600">Payments</th><th className="px-6 py-4 text-sm text-slate-600">Collected</th></tr></thead>
              <tbody>{(report.dailyCollections ?? []).map((day) => <tr key={day.date} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-6 py-4 text-sm text-slate-600">{day.date}</td><td className="px-6 py-4 text-sm text-slate-600">{day.count}</td><td className="px-6 py-4 text-sm text-slate-600">{money(day.totalAmount)}</td></tr>)}
                {(report.dailyCollections ?? []).length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No payments in this period.</td></tr>}
              </tbody>
            </table></div>
          </section>
        </>
      )}
    </div>
  );
}
