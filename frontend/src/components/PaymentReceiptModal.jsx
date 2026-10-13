import { useEffect, useState } from "react";
import api from "../api/axios";

export default function PaymentReceiptModal({ paymentId, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get(`/payments/${paymentId}/receipt`)
      .then(({ data }) => { if (active) setReceipt(data.receipt); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load receipt."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [paymentId]);

  const fields = receipt ? [
    ["Receipt number", receipt.receiptNumber],
    ["Payment ID", receipt.paymentId],
    ["Invoice ID", receipt.invoiceId],
    ["Citizen", receipt.citizen?.fullName],
    ["National ID", receipt.citizen?.nationalId],
    ["Description", receipt.description],
    ["Amount paid", Number(receipt.amountPaid).toFixed(2)],
    ["Payment method", receipt.paymentMethod?.replaceAll("_", " ")],
    ["Transaction reference", receipt.transactionReference],
    ["Payment date", receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleString() : null],
    ["Invoice status", receipt.invoiceStatus],
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Payment receipt" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold">Payment Receipt</h2>
          <button type="button" onClick={onClose} className="rounded-lg border px-3 py-1.5">Close</button>
        </div>
        {loading && <p>Loading receipt…</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        {receipt && (
          <div id="payment-receipt-content">
            <h3 className="mb-1 text-center text-lg font-bold">Municipality Payment Receipt</h3>
            <p className="mb-5 text-center text-sm text-gray-500">{receipt.receiptNumber}</p>
            <dl className="divide-y rounded-lg border">
              {fields.map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 gap-3 px-4 py-2 text-sm">
                  <dt className="font-medium text-gray-600">{label}</dt>
                  <dd className="break-words text-right">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
            <button type="button" onClick={() => {
              const content = document.getElementById("payment-receipt-content");
              if (!content) return;
              const win = window.open("", "_blank", "width=720,height=800");
              if (!win) { window.alert("Please allow pop-ups to print the receipt."); return; }
              const escaped = content.innerHTML.replace(/<button[\s\S]*?<\/button>/gi, "");
              win.document.write(`<!doctype html><html><head><title>Receipt ${receipt.receiptNumber}</title><style>body{font:14px Arial,sans-serif;max-width:700px;margin:40px auto;padding:20px}h3,p{text-align:center}dl{border:1px solid #ddd}dl div{display:flex;justify-content:space-between;gap:20px;padding:10px;border-bottom:1px solid #eee}dt{font-weight:bold}dd{margin:0;text-align:right}</style></head><body>${escaped}</body></html>`);
              win.document.close();
              win.focus();
              win.print();
            }} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white print:hidden">Print Receipt</button>
          </div>
        )}
      </div>
    </div>
  );
}
