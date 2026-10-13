
import { X, ClipboardList, UserRound } from "lucide-react";

function ViewRequestModal({ request, onClose }) {
  if (!request) return null;

  const formatText = (value) =>
    value ? String(value).replaceAll("_", " ") : "—";

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <ClipboardList size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Request #{request.id}
              </h2>
              <p className="text-sm text-slate-500">
                Municipality Request Details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close request details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-5 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserRound size={18} className="text-blue-600" />
            Citizen Information
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Full Name</p>
              <p className="mt-1 font-medium text-slate-800">
                {request.citizen?.firstName}{" "}
                {request.citizen?.lastName}
              </p>
            </div>

            <div>
              <p className="text-slate-500">National ID</p>
              <p className="mt-1 font-medium text-slate-800">
                {request.citizen?.nationalId || "—"}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className="mb-4 text-sm font-semibold text-slate-700">
              Request Information
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Request Type</p>
                <p className="mt-1 font-medium text-slate-800">
                  {formatText(request.type)}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Status</p>
                <p className="mt-1 font-medium text-slate-800">
                  {formatText(request.status)}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Submission Date</p>
                <p className="mt-1 font-medium text-slate-800">
                  {formatDate(request.submissionDate)}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Completion Date</p>
                <p className="mt-1 font-medium text-slate-800">
                  {formatDate(request.completionDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default ViewRequestModal;
