import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye, MoreHorizontal, User, FileText } from 'lucide-react';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

export function RecentRequestsTable({ requests = [] }) {
  const [selectedRequest, setSelectedRequest] = useState(null);

  return (
    <>
      <Card
        title="Recent Service Requests"
        subtitle="Latest citizen applications and infrastructure tickets"
        action={
          <Link
            to="/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>View All Requests</span>
            <ExternalLink size={13} />
          </Link>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Request & Citizen</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => setSelectedRequest(req)}
                >
                  {/* Request ID + Citizen */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                        #{req.id}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[170px] sm:max-w-xs">
                          {req.type}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <User size={11} className="text-slate-400" />
                          <span>
                            {req.citizen.firstName} {req.citizen.lastName}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-[10px]">
                            {req.citizen.nationalId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category Pill */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                      Public Works
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={req.urgency} size="sm" />
                  </td>

                  {/* Submission date */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <span className="block font-medium text-slate-700">
                      {formatDate(req.submissionDate)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeTime(req.submissionDate)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={req.status} size="sm" />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(req);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Inspect record"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal Preview */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={`Request Details — #${selectedRequest?.id}`}
        subtitle="Official Municipal Record Overview"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequest(null)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert(`Direct status editing for #${selectedRequest?.id} will be connected in Phase 2 & 3.`);
                setSelectedRequest(null);
              }}
            >
              Update Status
            </Button>
          </>
        }
      >
        {selectedRequest && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-600 mb-1">
                Application Type
              </div>
              <div className="text-sm font-bold text-slate-900">
                {selectedRequest.type}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-600 block text-[11px]">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedRequest.status} size="sm" />
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-600 block text-[11px]">Priority Level</span>
                <div className="mt-1">
                  <StatusBadge status={selectedRequest.urgency} size="sm" />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200">
              <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <User size={13} className="text-blue-600" />
                Citizen Information
              </h5>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-600 block text-[10px]">Full Name</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRequest.citizen.firstName} {selectedRequest.citizen.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">National ID</span>
                  <span className="font-mono text-slate-800">
                    {selectedRequest.citizen.nationalId}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-100">
                  <span className="text-slate-600 block text-[10px]">Contact Phone</span>
                  <span className="text-slate-800">{selectedRequest.citizen.phoneNumber}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200">
              <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <FileText size={13} className="text-blue-600" />
                Timeline & Processing
              </h5>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Submitted On:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(selectedRequest.submissionDate)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Completion Target:</span>
                <span className="font-medium text-slate-800">
                  {selectedRequest.completionDate ? formatDate(selectedRequest.completionDate) : 'Under standard review (5-7 business days)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default RecentRequestsTable;
