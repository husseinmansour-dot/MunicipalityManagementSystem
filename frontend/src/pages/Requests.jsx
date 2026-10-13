
import { useEffect, useState } from "react";

import { ClipboardList, RefreshCw, Eye, Pencil, Plus } from "lucide-react";

import ViewRequestModal from "../components/ViewRequestModal";

import UpdateRequestStatusModal from "../components/UpdateRequestStatusModal";

import api from "../api/axios";

import AddRequestModal from "../components/AddRequestModal";



function Requests() {

  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [requestToUpdate, setRequestToUpdate] = useState(null);

  const [showAddRequest, setShowAddRequest] = useState(false);

  const [searchCitizen, setSearchCitizen] = useState("");

  const [filterStatus, setFilterStatus] = useState("ALL");

  const [filterType, setFilterType] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const requestsPerPage = 5;



  async function fetchRequests() {

    setLoading(true);

    setError("");



    try {

      const response = await api.get("/requests");

      setRequests(

        Array.isArray(response.data) ? response.data : []

      );

    } catch (err) {

      setError(

        err.response?.data?.message ||

        "Unable to load requests."

      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    fetchRequests();

  }, []);



  function formatType(type) {

    return type.replaceAll("_", " ");

  }



  function formatDate(date) {

    return date

      ? new Date(date).toLocaleDateString()

      : "—";

  }



  const pending = requests.filter(

    (request) => request.status === "PENDING"

  ).length;



  const approved = requests.filter(

    (request) => request.status === "APPROVED"

  ).length;



  const requestTypes = [...new Set(requests.map(r => r.type))];



  const filteredRequests = requests.filter((request) => {

    const citizenName = `${request.citizen?.firstName || ""} ${

        request.citizen?.lastName || ""

    }`.toLowerCase();



    const matchesCitizen = citizenName.includes(

        searchCitizen.trim().toLowerCase()

    );



    const matchesStatus =

        filterStatus === "ALL" || request.status === filterStatus;



    const matchesType =

        filterType === "ALL" || request.type === filterType;



    return matchesCitizen && matchesStatus && matchesType;

    });



    const totalPages = Math.max(

        1,

        Math.ceil(filteredRequests.length / requestsPerPage)

        );



        const startIndex = (currentPage - 1) * requestsPerPage;



        const paginatedRequests = filteredRequests.slice(

        startIndex,

        startIndex + requestsPerPage

    );



    useEffect(() => {

        setCurrentPage(1);

        }, [searchCitizen, filterStatus, filterType]);



        useEffect(() => {

        if (currentPage > totalPages) {

            setCurrentPage(totalPages);

        }

        }, [currentPage, totalPages]);



  return (



    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Requests Management
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Track and manage municipality service requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddRequest(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          New Request
        </button>
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {[

          ["Total Requests", requests.length],

          ["Pending", pending],

          ["Approved", approved]

        ].map(([label, value]) => (

          <div

            key={label}

            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"

          >

            <div className="flex items-center gap-3">

              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">

                <ClipboardList size={22} />

              </div>

              <div>

                <p className="text-sm text-slate-500">{label}</p>

                <h3 className="text-2xl font-bold text-slate-800">

                  {value}

                </h3>

              </div>

            </div>

          </div>

        ))}

      </div>



      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-5 flex justify-between items-center">

          <h3 className="font-semibold text-slate-800">

            All Requests

          </h3>

          <button

            type="button"

            onClick={fetchRequests}

            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50"

          >

            <RefreshCw size={16} />

            Refresh

          </button>

        </div>



        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 pb-5">



        {/* Search by citizen */}

        <input

            type="text"

            placeholder="Search citizen name..."

            value={searchCitizen}

            onChange={(e) => setSearchCitizen(e.target.value)}

            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"

        />



        {/* Filter by status */}

        <select

            value={filterStatus}

            onChange={(e) => setFilterStatus(e.target.value)}

            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"

        >

            <option value="ALL">All Statuses</option>

            <option value="PENDING">Pending</option>

            <option value="APPROVED">Approved</option>

            <option value="REJECTED">Rejected</option>

            <option value="COMPLETED">Completed</option>

        </select>



        {/* Filter by request type */}

        <select

            value={filterType}

            onChange={(e) => setFilterType(e.target.value)}

            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"

        >

            <option value="ALL">All Request Types</option>



            {requestTypes.map((type) => (

            <option key={type} value={type}>

                {formatType(type)}

            </option>

            ))}

        </select>



        </div>



        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-50 border-y border-slate-100">

              <tr className="text-xs uppercase text-slate-500">

                <th className="px-6 py-4">ID</th>

                <th className="px-6 py-4">Citizen</th>

                <th className="px-6 py-4">Type</th>

                <th className="px-6 py-4">Submitted</th>

                <th className="px-6 py-4">Status</th>

                <th className="px-6 py-4">Completed</th>

                <th className="px-6 py-4 text-right">Actions</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {!loading && !error && paginatedRequests.map((request) => (

                <tr key={request.id} className="hover:bg-slate-50">

                  <td className="px-6 py-4 text-sm text-slate-500">

                    #{request.id}

                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-slate-800">

                    {request.citizen?.firstName}{" "}

                    {request.citizen?.lastName}

                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">

                    {formatType(request.type)}

                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">

                    {formatDate(request.submissionDate)}

                  </td>

                  <td className="px-6 py-4">

                    <span

                      className={

                        "inline-flex px-3 py-1 rounded-full text-xs font-semibold " +

                        (request.status === "APPROVED"

                          ? "bg-green-50 text-green-700"

                          : request.status === "PENDING"

                          ? "bg-amber-50 text-amber-700"

                          : "bg-slate-100 text-slate-600")

                      }

                    >

                      {formatType(request.status)}

                    </span>

                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">

                    {formatDate(request.completionDate)}

                  </td>

                  <td className="px-6 py-4 text-right">

                    <div className="flex items-center justify-end gap-2">

                        <button

                        type="button"

                        onClick={() => setSelectedRequest(request)}

                        title="View request details"

                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"

                        >

                        <Eye size={18} />

                        </button>



                        {["PENDING", "APPROVED"].includes(request.status) && (

                        <button

                            type="button"

                            onClick={() => setRequestToUpdate(request)}

                            title="Update request status"

                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"

                        >

                            <Pencil size={18} />

                        </button>

                        )}

                    </div>

                    </td>

                </tr>

              ))}

            </tbody>

          </table>



          {loading && (

            <p className="text-center py-12 text-slate-500">

              Loading requests...

            </p>

          )}



          {!loading && error && (

            <p className="text-center py-12 text-red-600">

              {error}

            </p>

          )}



          {!loading && !error && filteredRequests.length === 0 && (

            <p className="text-center py-12 text-slate-500">

              No matching requests found.

            </p>

          )}

        </div>



        {!loading && !error && filteredRequests.length > 0 && (

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">



            <p className="text-sm text-slate-500">

            Showing {startIndex + 1}–

            {Math.min(

                startIndex + requestsPerPage,

                filteredRequests.length

            )} of {filteredRequests.length} requests

            </p>



            <div className="flex items-center gap-3">

            <button

                type="button"

                onClick={() =>

                setCurrentPage((page) => Math.max(1, page - 1))

                }

                disabled={currentPage === 1}

                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"

            >

                Previous

            </button>



            <span className="text-sm font-medium text-slate-700">

                Page {currentPage} of {totalPages}

            </span>



            <button

                type="button"

                onClick={() =>

                setCurrentPage((page) => Math.min(totalPages, page + 1))

                }

                disabled={currentPage === totalPages}

                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"

            >

                Next

            </button>

            </div>

        </div>

        )}



      </section>

      {selectedRequest && (

            <ViewRequestModal

                request={selectedRequest}

                onClose={() => setSelectedRequest(null)}

            />

            )}

            {requestToUpdate && (

                <UpdateRequestStatusModal

                    request={requestToUpdate}

                    onClose={() => setRequestToUpdate(null)}

                    onUpdated={fetchRequests}

                />

        )}

      {showAddRequest && (
        <AddRequestModal
          onClose={() => setShowAddRequest(false)}
          onCreated={fetchRequests}
        />
      )}
    </div>

  );

}



export default Requests;
