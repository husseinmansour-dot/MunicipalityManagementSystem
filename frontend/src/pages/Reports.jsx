
import { useEffect, useState } from "react";
import {
  Users, ClipboardList, ClipboardCheck,
  Wallet, RefreshCw, Download
} from "lucide-react";
import api from "../api/axios";

const today = new Date().toISOString().slice(0, 10);

function ReportCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon size={22} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-800">
        {value ?? 0}
      </p>
    </div>
  );
}

function downloadCSV(filename, headers, rows) {
  const escape = (value) => {
    let text = String(value ?? "");
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) {
      text = "'" + text;
    }
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = "\uFEFF" +
    [headers, ...rows]
      .map(row => row.map(escape).join(","))
      .join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [startDate, setStartDate] = useState(
    `${today.slice(0, 7)}-01`
  );
  const [endDate, setEndDate] = useState(today);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [financeError, setFinanceError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [
          citizens, requests, permits, expired, expiring
        ] = await Promise.all([
          api.get("/citizens", {
            params: { page: 1, limit: 1 }
          }),
          api.get("/requests/statistics"),
          api.get("/permits/statistics"),
          api.get("/permits/expired"),
          api.get("/permits/expiring-soon")
        ]);

        if (!cancelled) {
          setOverview({
            citizens: citizens.data.pagination.total,
            requests: requests.data,
            permits: permits.data,
            expired: expired.data.totalExpired,
            expiring: expiring.data.totalExpiringSoon
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            "Failed to load municipality reports."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;

    async function loadFinancial() {
      if (!startDate || !endDate || startDate > endDate) {
        setFinancial(null);
        setFinanceError("Select a valid date range.");
        return;
      }

      setFinanceError("");

      try {
        const response = await api.get("/reports/financial", {
          params: { startDate, endDate }
        });
        if (!cancelled) setFinancial(response.data);
      } catch (err) {
        if (!cancelled) {
          setFinancial(null);
          setFinanceError(
            err.response?.data?.message ||
            "Failed to load financial report."
          );
        }
      }
    }

    loadFinancial();
    return () => { cancelled = true; };
  }, [startDate, endDate, refresh]);

  async function exportReport(type) {
    setExporting(type);
    setError("");

    try {
      if (type === "finance") {
        const response = await api.get(
          "/reports/financial/export",
          {
            params: { startDate, endDate },
            responseType: "blob"
          }
        );

        const url = URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          `financial-report-${startDate}-to-${endDate}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }

      const endpoint = {
        citizens: "/citizens",
        requests: "/requests",
        permits: "/permits"
      }[type];

      const first = await api.get(endpoint, {
        params: { page: 1, limit: 100 }
      });

      if (!Array.isArray(first.data?.data)) {
        throw new Error(
          "Expected paginated API response. Check the backend."
        );
      }

      const records = [...first.data.data];
      const totalPages =
        first.data.pagination?.totalPages ?? 1;

      for (let page = 2; page <= totalPages; page++) {
        const response = await api.get(endpoint, {
          params: { page, limit: 100 }
        });
        records.push(...response.data.data);
      }

      if (type === "citizens") {
        downloadCSV(
          "citizens-report.csv",
          ["ID", "First Name", "Last Name",
           "National ID", "Phone", "Address"],
          records.map(c => [
            c.id, c.firstName, c.lastName,
            c.nationalId, c.phoneNumber, c.address
          ])
        );
      }

      if (type === "requests") {
        downloadCSV(
          "requests-report.csv",
          ["ID", "Citizen", "Type", "Status", "Submitted"],
          records.map(r => [
            r.id,
            `${r.citizen?.firstName ?? ""} ${r.citizen?.lastName ?? ""}`,
            r.type, r.status, r.submissionDate
          ])
        );
      }

      if (type === "permits") {
        downloadCSV(
          "permits-report.csv",
          ["ID", "Citizen", "Type", "Status", "Applied", "Expires"],
          records.map(p => [
            p.id,
            `${p.citizen?.firstName ?? ""} ${p.citizen?.lastName ?? ""}`,
            p.type, p.status, p.applicationDate, p.expiryDate
          ])
        );
      }
    } catch (err) {
      setError(err.message || "Export failed.");
    } finally {
      setExporting("");
    }
  }

  const buttonStyle =
    "flex items-center justify-center gap-2 rounded-xl " +
    "bg-blue-600 px-4 py-2.5 text-sm font-medium text-white " +
    "hover:bg-blue-700 disabled:opacity-50";

  const exportButton = (type, label) => (
    <button
      type="button"
      disabled={Boolean(exporting)}
      onClick={() => exportReport(type)}
      className={buttonStyle}
    >
      <Download size={17} />
      {exporting === type ? "Exporting..." : label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Reports Management
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Municipality statistics and downloadable reports.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefresh(v => v + 1)}
          className={buttonStyle}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {loading && !overview && (
        <p className="text-slate-500">Loading reports...</p>
      )}

      {overview && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ReportCard icon={Users} title="Citizens Report">
            <div className="mb-5 grid grid-cols-2 gap-3">
              <Stat label="Total Citizens" value={overview.citizens} />
            </div>
            {exportButton("citizens", "Export Citizens CSV")}
          </ReportCard>

          <ReportCard icon={ClipboardList} title="Requests Report">
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {["total", "pending", "approved", "rejected", "completed"]
                .map(key => (
                  <Stat
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={overview.requests?.[key]}
                  />
                ))}
            </div>
            {exportButton("requests", "Export Requests CSV")}
          </ReportCard>

          <ReportCard icon={ClipboardCheck} title="Permits Report">
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {["total", "pending", "approved", "rejected"].map(key => (
                <Stat
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={overview.permits?.[key]}
                />
              ))}
              <Stat label="Expired" value={overview.expired} />
              <Stat label="Expiring Soon" value={overview.expiring} />
            </div>
            {exportButton("permits", "Export Permits CSV")}
          </ReportCard>

          <ReportCard icon={Wallet} title="Financial Report">
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                />
              </label>
              <label className="text-sm text-slate-600">
                End Date
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                />
              </label>
            </div>

            {financeError && (
              <p className="mb-3 text-sm text-red-600">{financeError}</p>
            )}

            {financial && (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <Stat
                    label="Total Payments"
                    value={financial.summary?.totalPayments}
                  />
                  <Stat
                    label="Total Collected"
                    value={financial.summary?.totalCollected}
                  />
                </div>

                <div className="mb-5 space-y-2">
                  {Object.entries(financial.byPaymentMethod ?? {})
                    .map(([method, info]) => (
                      <div
                        key={method}
                        className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm"
                      >
                        <span>{method.replaceAll("_", " ")}</span>
                        <span className="font-semibold">
                          {info.totalAmount}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}

            <button
              type="button"
              disabled={
                Boolean(exporting) ||
                Boolean(financeError) ||
                !financial
              }
              onClick={() => exportReport("finance")}
              className={buttonStyle}
            >
              <Download size={17} />
              {exporting === "finance"
                ? "Exporting..."
                : "Export Financial CSV"}
            </button>
          </ReportCard>
        </div>
      )}
    </div>
  );
}
